# syntax=docker/dockerfile:1
#
# Strata for StartOS. Mirrors upstream's strata/Dockerfile with three differences:
# the engine is built portable (AVX2 baseline, not the build machine's CPU), it
# is copied into a CUDA runtime image instead of shipping the devel toolchain,
# and the fixes in patches/ are applied to the source.

ARG CUDA_VERSION=13.0.0

FROM nvidia/cuda:${CUDA_VERSION}-devel-ubuntu24.04 AS build

ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1 LANG=C.UTF-8

RUN apt-get update && apt-get install -y --no-install-recommends \
        build-essential ca-certificates curl git libatomic1 libgomp1 \
        python3 python3-pip python3-venv unzip \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/strata
COPY strata/ .

ARG CUDA_ARCHITECTURES=75;80;86;89;120

RUN python3 -m venv .venv \
    && .venv/bin/pip install --no-cache-dir --upgrade pip \
    && .venv/bin/pip install --no-cache-dir -r requirements.txt \
    && chmod +x setup.sh docker-entrypoint.sh

# BUILD.json is what setup.py reads to decide whether the engine is current:
# source=local with a matching src hash means a start never recompiles.
RUN .venv/bin/python - <<'PYEOF'
import json, os, shutil
import setup

llama = setup.get_llama_cpp()
nvcc, _ = setup.find_nvcc()
arch = os.environ["CUDA_ARCHITECTURES"].strip().strip('"').replace(",", ";")

setup.cmake_build(setup.ROOT, setup.ROOT / "build", "strata",
    ["-DSTRATA_ENABLE_CUDA=ON", "-DSTRATA_BUILD_TESTS=OFF", "-DSTRATA_PORTABLE=ON",
     f"-DCMAKE_CUDA_ARCHITECTURES={arch}", f"-DCMAKE_CUDA_COMPILER={nvcc}",
     f"-DSTRATA_GGML_DIR={llama}"], None, "build-strata.bat")
setup.cmake_build(setup.ROOT / "tools" / "vision", setup.ROOT / "build-vision", "strata-vision",
    [f"-DLLAMA_DIR={llama}", "-DSTRATA_VISION_CUDA=ON", "-DSTRATA_PORTABLE=ON",
     f"-DCMAKE_CUDA_ARCHITECTURES={arch}", f"-DCMAKE_CUDA_COMPILER={nvcc}"], None, "build-vision.bat")

eng = setup.ROOT / "engine"
eng.mkdir(exist_ok=True)
shutil.copy2(setup.ROOT / "build" / setup.EXE, eng / setup.EXE)
shutil.copy2(setup.ROOT / "build-vision" / "bin" / setup.VEXE, eng / setup.VEXE)
meta = {"source": "local", "version": setup.source_version(),
        "archs": [int(a.split("-")[0]) for a in arch.split(";") if a.split("-")[0].isdigit()], "vision": "gpu",
        "cuda_dirs": ["/usr/local/cuda/lib64"],
        "src": setup.source_hash(setup.ENGINE_SOURCES),
        "vision_src": setup.source_hash(setup.VISION_SOURCES)}
(eng / "BUILD.json").write_text(json.dumps(meta, indent=1))
PYEOF

RUN rm -rf build build-vision

# After the engine build: the patched files are outside the engine's source
# hash (setup.ENGINE_SOURCES), and a patch change then skips the CUDA compile.
COPY patches/ /tmp/patches/
RUN for p in /tmp/patches/*.patch; do git apply --verbose "$p" || exit 1; done && rm -rf /tmp/patches

FROM nvidia/cuda:${CUDA_VERSION}-runtime-ubuntu24.04

ENV DEBIAN_FRONTEND=noninteractive PYTHONUNBUFFERED=1 LANG=C.UTF-8 STRATA_EXECV=1

RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl libatomic1 libgomp1 python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /opt/strata /opt/strata
WORKDIR /opt/strata

EXPOSE 8080
ENTRYPOINT ["./docker-entrypoint.sh"]

#!/usr/bin/env zsh

PPTX_FILE_PATH=$1
PPTX_FILE_NAME=$(basename "${PPTX_FILE_PATH}" .pptx)

INSPECT_DIR_PATH="./local/inspections/${PPTX_FILE_NAME}"

rm -rf "${INSPECT_DIR_PATH}"
mkdir -p "${INSPECT_DIR_PATH}"
unzip "${PPTX_FILE_PATH}" -d "${INSPECT_DIR_PATH}"

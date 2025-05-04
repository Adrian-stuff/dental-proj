// place files you want to import through the `$lib` alias in this folder.
export async function convertFileToBytea(file: File) {

  if (!file) {
    throw new Error('No file selected');
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);


  return uint8Array;
}
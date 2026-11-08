// Two workers overlap network waits without uploading every page at once.
export async function readPageBatch(pages, read, onResult, isActive = () => true) {
  let next = 0;
  let completed = 0;
  async function worker() {
    while (isActive()) {
      const index = next++;
      if (index >= pages.length) return;
      const page = pages[index];
      let result;
      try { result = await read(page); }
      catch { result = { marks: [], scannerNote: 'This page could not be read. Type its mark.' }; }
      if (!isActive()) return;
      completed++;
      onResult(page, result, completed);
    }
  }
  await Promise.all(Array.from({ length: Math.min(2, pages.length) }, worker));
}

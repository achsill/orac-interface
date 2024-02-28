import axios from "axios";
import fs from "fs";
import progress from "progress-stream";
import { ipcMain } from "electron";

class Downloader {
  private static instance: Downloader;
  private progressStream: progress.ProgressStream | null = null;
  private outputPath: string = "";
  private modelName: string;

  private constructor(private windowManager: any) {}

  public static getInstance(windowManager: any): Downloader {
    if (!Downloader.instance) {
      Downloader.instance = new Downloader(windowManager);
    }
    return Downloader.instance;
  }

  async downloadFile(url: string, outputPath: string, modelName: string) {
    this.outputPath = outputPath;
    this.modelName = modelName;
    const { headers } = await axios.head(url);
    const totalSize = headers["content-length"];

    this.progressStream = progress({
      length: totalSize,
      time: 100,
    });

    this.progressStream.on("progress", (progressData: any) => {
      this.windowManager.settingsWindow?.webContents.send(
        "download-data",
        progressData
      );
      console.log(
        `Downloaded ${progressData.transferred} out of ${
          progressData.length
        } bytes (${progressData.percentage.toFixed(2)}%)`
      );
      console.log(`Speed: ${progressData.speed} bytes/s`);
      console.log(`Remaining: ${progressData.eta} seconds`);
    });

    const response = await axios({
      url,
      method: "GET",
      responseType: "stream",
    });

    response.data
      .pipe(this.progressStream)
      .pipe(fs.createWriteStream(outputPath))
      .on("finish", () => {
        console.log("Download completed.");
        this.progressStream = null;
        this.windowManager.settingsWindow?.webContents.send(
          "download-completed",
          this.modelName
        );
      })
      .on("error", (err: any) => console.log("Download error:", err.message))
      .on("close", () => {
        console.log("Stream closed.", "Download was interrupted.");
      });

    ipcMain.on("stop-download", async () => {
      this.stopDownload();
    });
  }

  stopDownload() {
    if (this.progressStream) {
      this.progressStream.destroy();
      console.log("Download stopped");
      this.cleanupFile(this.outputPath);
    }
  }

  private cleanupFile(filePath: string) {
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting file", err);
      else console.log(`Successfully deleted file: ${filePath}`);
    });
  }
}

export default Downloader;

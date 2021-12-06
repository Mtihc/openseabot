import * as fs from "fs";
import path from "path";
import IStore from "./IStore";

class FileStore implements IStore {
  private readonly filePath: string;
  private readonly data: any;

  constructor(filePath: string) {
    if (!filePath) {
      throw new Error("Missing argument filePath. For example: new FileStore('data.json')");
    }
    this.filePath = filePath;
    this.data = this._loadData();
  }

  public _loadData(): any {
    try {
      return JSON.parse(fs.readFileSync(this.filePath, { encoding: "utf-8", flag: "r" }));
    } catch (error) {
      return {};
    }
  }

  public _saveData(data): void {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: "${dir}"`);
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), { flag: "w+" });
  }

  public getLastAssetEventTransactionTimestamp(): number {
    return parseInt(this.data.lastAssetEventTransactionTimestamp || "0", 10);
  }

  public setLastAssetEventTransactionTimestamp(value: number): void {
    this.data.lastAssetEventTransactionTimestamp = value.toString();
    this._saveData(this.data);
  }
}

export default FileStore;

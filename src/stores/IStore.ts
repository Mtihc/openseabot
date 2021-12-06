interface IStore {
    getLastAssetEventTransactionTimestamp(): number;
    setLastAssetEventTransactionTimestamp(value: number): void;
}

export default IStore;

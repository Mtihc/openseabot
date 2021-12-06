interface IMessenger {
    sendAssetEventMessages(assetEvents: any[]): Promise<void[]>;
}

export default IMessenger;

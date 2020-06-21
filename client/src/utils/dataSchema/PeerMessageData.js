class messageTextData {
  constructor({ message, size }) {
    this.message = message;
    this.size = size;
  }
}

class messageFileData {
  constructor({ fingerprint, message, size }) {
    this.fingerprint = fingerprint;
    this.message = message;
    this.size = size;
  }
}

class messageDownloadData {
  constructor({ fingerprint }) {
    this.fingerprint = fingerprint;
  }
}


export {
  messageTextData,
  messageFileData,
  messageDownloadData,
}

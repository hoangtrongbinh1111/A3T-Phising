const MALICIOUS = 1;
const UNMALICIOUS = 0;
const LAB_FOLDER = "labs";
const LAB_SUBFOLDER = {
    trainLogPath : "log_train",
    testLogPath: "log_test",
    trainedModelPath: "trained_model"
};

const DATA_FOLDER = "datas";
const DATA_SUBFOLDER = {
  trainFolder : "train",
  testFolder :  "test",
  validationFolder : "validation",
}

module.exports = {
  MALICIOUS,
  UNMALICIOUS,
  DATA_FOLDER,
  DATA_SUBFOLDER,
  LAB_FOLDER,
  LAB_SUBFOLDER
};

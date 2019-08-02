const inquirer = require("inquirer");
const CURR_DIR = process.cwd();
const util = require("util");
const execFile = util.promisify(require("child_process").execFile);
const spawn = require("child_process").spawn;
const clear = require("clear");
const fs = require("fs-extra");
const chalk = require("chalk");
const editJsonFile = require("edit-json-file");

/**
 * questions
 * @type {*[]}
 */
const Questions = [
  {
    type: "input",
    name: "project_name",
    message: "what is your project name",
    validate: function(input) {
      if (fs.existsSync(input)) {
        return "project with this name exists";
      }
      if (/^([a-z\-\_\d])+$/.test(input)) return true;
      else
        return "Project name may only include letters(lowercase), numbers, underscores and hashes.";
    }
  },
  {
    type: "list",
    name: "css",
    message: "choose your css library",
    choices: [
      {
        name: "jss"
      },
      new inquirer.Separator(),
      {
        name: "postcss"
      },
      new inquirer.Separator(),
      {
        name: disable("material-ui"),
        disabled: warning("Coming soon")
      },
      new inquirer.Separator(),
      {
        name: disable("ant design"),
        disabled: warning("Coming soon")
      }
    ]
  },
  {
    type: "list",
    name: "state",
    message: "choose your state management",
    choices: [
      "Redux",
      new inquirer.Separator(),
      {
        name: disable("Context API"),
        disabled: warning("Coming soon")
      }
    ],
    filter: function(value) {
      return value.toLowerCase();
    }
  }
];

//warning style
function warning(text) {
  return chalk.yellow(text);
}

//disable style
function disable(text) {
  return chalk.grey(text);
}

/**
 * clear and run program
 */
function firstRun() {
  clear();
  console.log(chalk.blue("React Easy Boilerplate \n"));
}

/**
 * create directory and copy skeleton into project folder
 * @param templatePath
 * @param newProjectPath
 * @param projectName
 */
function createDirectoryContents(templatePath, newProjectPath, projectName) {
  const filesToCreate = fs.readdirSync(templatePath);

  filesToCreate.forEach(file => {
    const origFilePath = `${templatePath}/${file}`;

    // get stats about the current file
    const stats = fs.statSync(origFilePath);

    if (stats.isFile()) {
      let contents = fs.readFileSync(origFilePath, "utf8");

      if (file === "package.json") {
        let jsonPackage = editJsonFile(`${templatePath}/${file}`);

        //change project name
        jsonPackage.set("name", projectName);

        jsonPackage.save();
      }
      const writePath = `${newProjectPath}/${file}`;
      fs.writeFileSync(writePath, contents, "utf8");
    }

    if (stats.isDirectory()) {
      fs.copy(templatePath, newProjectPath, error => {
        return true;
      }); // copies file
    }
  });
}

/**
 * get version of node
 * @returns {Promise<*>}
 */
async function getVersion() {
  const { stdout } = await execFile("node", ["--version"]);
  return stdout;
}

function promisifySpawn(projectPath, bar) {
  changeDirectory(projectPath);

  return new Promise((resolve, reject) => {
    const child = spawn("npm", ["install", "--no-progress"], {
      stdio: ["pipe", "pipe", process.stderr],
      shell: true
    });

    barIncrement(child.stdout);

    async function barIncrement(outStream) {
      for await (const data of outStream) {
        bar.increment(5);
      }
    }

    child.on("exit", code => {
      if (code !== 0) {
        const err = new Error(`child exited with code ${code}`);
        err.code = code;
        err.stderr = process.stderr;
        reject(err);
      } else resolve(process.stdout);
    });

    // child.on("error", reject({ errrr: process.stderr }));
  });
}

function changeDirectory(directory) {
  process.chdir(directory);
}

module.exports = {
  createDirectoryContents,
  CURR_DIR,
  changeDirectory,
  Questions,
  firstRun,
  promisifySpawn
};

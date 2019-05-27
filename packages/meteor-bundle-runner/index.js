var fs = require("fs")
var os = require("os")
var path = require("path")
var _ = require("underscore")
var yaml = require("js-yaml")


var getServerDir = function(){
  var serverDir = process.env.SERVER_DIR;  
  if (!serverDir) {
    try {
      serverDir = path.dirname(require.resolve("steedos-server"));
      serverDir = path.join(serverDir, "bundle", "programs", "server");
    } catch (e) {
      console.error(e);
      process.env.NODE_OPTIONS="";
      var npmRoot = require('child_process').execSync('npm root -g').toString().trim()
      try {
          serverDir = path.join(npmRoot, "steedos-server", "bundle", "programs", "server")
      } catch (err) {
          console.error(`Install steedos server first with: yarn`)
          process.exit(1)
      }
    }
  } else {
      serverDir = path.join(serverDir, "bundle", "programs", "server");
  }
  
  if (!fs.existsSync(serverDir))
  {
      console.error(`serverDir not found: ${serverDir}`);
      console.error(`Install steedos server first with: yarn`)
      process.exit(1)
  }  
  return serverDir;
}

var getSettings = function(){
  
  var settingsFileName = 'steedos-config.yml'
  var settingsPath = path.join(projectDir, settingsFileName)
  var settings = {
  };
  if(fs.existsSync(settingsPath)){
    try {
      settings = yaml.safeLoad(fs.readFileSync(settingsPath, 'utf8'));
    } catch (error) {
      console.error(`Invalid steedos-config.yml`, error)
    }
  }

  if(settings){
    process.env.METEOR_SETTINGS = JSON.stringify(settings)
  }

  // 环境变量，以settings中定义的为准
  if (settings.env){
    _.each(settings.env, function(item, key){
      process.env[key] = item
    })
  }

  return settings;

}
  
var projectDir = process.cwd();   
var serverDir = getServerDir();
var settings = getSettings();


var port = process.env.PORT;
if (!port){
  port = 3000;
  process.env.PORT = port
}

var rootUrl = process.env.ROOT_URL;      
if (!rootUrl) {
    rootUrl = "http://" + os.hostname() + ":" + port
    process.env.ROOT_URL = rootUrl
}

var mongoUrl =  process.env.MONGO_URL;       
if (!mongoUrl) {
  var _mongoHost = '127.0.0.1';
  var _mongoDatabase = 'steedos';
  var _mongoPort = '';
  var _mongoUrl = '';
  if(settings.datasources && settings.datasources.default){
    var defaultDataSource = settings.datasources.default.connection
    if(defaultDataSource.url){
      _mongoUrl = defaultDataSource.url
    }else{
      if(defaultDataSource.port){
        _mongoPort = defaultDataSource.port
      }
      if(defaultDataSource.host){
        _mongoHost = defaultDataSource.host
      }
      if(defaultDataSource.database){
        _mongoDatabase = defaultDataSource.database
      }
    }
  }
  if(_mongoUrl){
    mongoUrl = _mongoUrl
  }else if(_mongoPort){
    mongoUrl = `mongodb://${_mongoHost}:${_mongoPort}/${_mongoDatabase}`
  }else{
    mongoUrl = `mongodb://${_mongoHost}/${_mongoDatabase}`
  }
  process.env.MONGO_URL = mongoUrl
}

var ref, ref1, ref2, ref3;
var steedosStorageDir = "./storage"
var cfsSettings = typeof settings !== "undefined" && settings !== null ? (ref = settings["public"]) != null ? ref.cfs : void 0 : void 0;
if (cfsSettings && (cfsSettings != null ? (ref1 = cfsSettings.local) != null ? ref1.folder : void 0 : void 0)) {
  steedosStorageDir = cfsSettings.local.folder;
}

if (!path.isAbsolute(steedosStorageDir)) {
  steedosStorageDir = path.resolve(steedosStorageDir);
}

process.env.STEEDOS_STORAGE_DIR = steedosStorageDir

__steedos_bootstrap__ = {
    projectDir: projectDir,
    serverDir: serverDir,
    storageDir: steedosStorageDir,
    rootUrl: rootUrl,
    mongoUrl: mongoUrl,
    verbose: false
}

console.log("*******************************************************************");
console.log("*")
console.log(`*  Initialize Steedos Server ...`);
console.log("*")
console.log(`*  PORT: ${process.env.PORT}`);
console.log(`*  ROOT_URL: ${process.env.ROOT_URL}`);
console.log(`*  MONGO_URL: ${process.env.MONGO_URL}`);
console.log(`*  PROJECT_DIR: ${projectDir}`);
console.log(`*  SERVER_DIR: ${serverDir}`);
var ref, ref1;
if ((typeof settings !== "undefined" && settings !== null ? (ref2 = settings["public"]) != null ? (ref3 = ref2.cfs) != null ? ref3.store : void 0 : void 0 : void 0) === 'local') {
  console.log(`*  STORAGE_DIR: ${steedosStorageDir}`);
}
console.log("*")
console.log("*******************************************************************");

module.exports = require("./src/boot");


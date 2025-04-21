'use strict'

const exec        = require('child_process').exec
const repl        = require('repl')


if (!String.prototype.strip) {
  String.prototype.strip = function (c) {
    if (!c) {
      return this.trim()
    } else if (typeof c !== 'string') {
      throw new Error('argument to String.strip must be a string')
    } else if (!this.length) {
      return ''
    }

    let i = 0
    let j = this.length - 1
    while (this[i] === c) {
      i++
    }
    while (this[j] === c && j > i) {
      j--
    }

    return this.slice(i, j + 1)
  }
}


module.exports = docker


function docker (cmd, opts, cb) {
  if (typeof cmd !== 'string') {
    throw new Error('command must be a string')
  }
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  if (typeof opts !== 'object' && opts !== undefined) {
    throw new Error('options must be an object')
  }
  if (typeof cb !== 'function' && cb !== undefined) {
    throw new Error('callback must be a function')
  }
  opts = opts || {}

  // handle --help, -H, --version, and -v like commands immediately and quit
  let versionKeys = ['v', '-v', 'version', '--version']

  for (let i = 0; i < versionKeys.length; i++) {
    if ((cmd == versionKeys[i]) || (opts.docker && opts.docker[versionKeys[i]])) {
      let key = versionKeys[i].strip('-')

      if (key.length > 2) {
        key = '--' + key
      } else {
        key = '-' + key
      }

      run('docker ' + key, cb)
      return
    }
  }

  let helpKeys = ['h', '-h', 'help', '--help']

  for (let i = 0; i < helpKeys.length; i++) {
    if ((cmd == helpKeys[i]) || (opts.docker && opts[helpKeys[i]])) {
      let key = helpKeys[i].strip('-')

      if (key.length > 2) {
        key = '--' + key
      } else {
        key = '-' + key
      }

      run('docker ' + key, cb)
      return
    }
  }

  // run the docker command
  let dockerOptions = opts.docker || {}
  let args = opts.args || []
  let commandOptions = Object.keys(opts).reduce((obj, key) => {
    if (key === 'docker' || key === 'args') {
      return obj
    }
    obj[key] = opts[key]
    return obj
  }, {})
  let commandString = 'docker'

  commandString += ' ' + optionsString(dockerOptions)
  commandString += ' ' + cmd
  commandString += ' ' + optionsString(commandOptions)
  commandString += args.reduce((s, e) => s + ' ' + e, '')

  console.log('CMD:', commandString)
  run(commandString, cb)
}


function optionsString (opts) {
  return Object.keys(opts).reduce((str, key) => {
    let rawKey = key.strip('-')
    let opt = rawKey.length < 3 ? '-' + rawKey : '--' + rawKey
    let value = opts[key]

    if (value !== false) {
      str += ' ' + opt
      if (value !== true) {
        str += ' ' + value
      }
    }

    return str
  }, '')
}


function run (cmd, cb) {
  cb = cb || noop
  exec(cmd, function (err, stdout, stderr) {
    if (err) {
      console.log(err.message)
      return cb(err)
    }
    if (stderr) {
      console.log(stderr)
      return cb(new Error(stderr))
    }
    if (stdout) {
      console.log(stdout)
    }

    return cb(stdout)
  })
}


function noop () {}


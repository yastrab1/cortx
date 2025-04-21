#!/usr/bin/env node
'use strict'

const repl        = require('repl')
const replServer  = repl.start({ prompt: '> ' })
const docker      = require('../')

Object.defineProperty(replServer.context, 'docker', {
  configurable: false,
  enumerable: true,
  value: function (cmd, opts) {
    docker(cmd, opts, () => replServer.displayPrompt())
  }
})


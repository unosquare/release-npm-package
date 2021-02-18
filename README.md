# release-npm-package
Release Npm Package

# Usage
```yml
name: Release

on:
  workflow_dispatch:
    inputs:
      action-type:
        description: 'Action Type ( Release | Back )'
        required: true
        default: 'Release'
      sprint:
        description: 'Sprint Number'
        required: true
      release-notes:
        description: 'Tag Message'
        required: true
    

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - uses: Unosquare/release-npm-package@v3
        name: Getting Release Version
        with:
          action-type: ${{ github.event.inputs.action-type }}
          github_token: ${{ github.token }}
          sprint: ${{ github.event.inputs.sprint }}
          release-notes: ${{ github.event.inputs.release-notes }}
```

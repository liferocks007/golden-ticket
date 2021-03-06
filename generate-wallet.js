"use strict"
const BITBOXCli = require("bitbox-cli/lib/bitbox-cli").default
const BITBOX = new BITBOXCli()
const fs = require("fs")
const qrcode = require("qrcode-terminal")
const emoji = require("node-emoji")
const chalk = require("chalk")
const prompt = require("prompt")

const main = async () => {
  // start the prompt to get user input
  prompt.start()

  // ask for language, hdpath and walletFileName
  prompt.get(["language", "hdpath", "walletFileName"], (err, result) => {
    // generate mnemonic based on language input. Default to english
    const mnemonic = BITBOX.Mnemonic.generate(
      256,
      BITBOX.Mnemonic.wordLists()[
        result.language ? result.language.toLowerCase() : "english"
      ]
    )
    // show the user their mnemoninc
    console.log(`Your mnemonic is: ${chalk.red(mnemonic)}`)

    // root seed buffer
    const rootSeed = BITBOX.Mnemonic.toSeed(mnemonic)

    // master HDNode
    const masterHDNode = BITBOX.HDNode.fromSeed(rootSeed)

    // set the hdpath based on input. Default to BCH BIP44
    let hdpath
    if (result.hdpath) hdpath = result.hdpath
    else hdpath = "m/44'/145'/0'"

    console.log(`Your account's HDPath is ${hdpath}`)
    // HDNode of BIP44 account
    const account = BITBOX.HDNode.derivePath(masterHDNode, hdpath)

    // HDNode of first internal change address
    const mothership = BITBOX.HDNode.derivePath(account, `1/0`)
    console.log(`Your mothership's HDPath is ${hdpath}/1/0`)

    // mothership HDNode to cashAddr
    const mothershipAddress = BITBOX.HDNode.toCashAddress(mothership)

    // show mothership address qr code
    console.log(`Fund the mothership at: ${mothershipAddress}\n`)
    qrcode.generate(mothershipAddress)

    // mnemonic, hdpath and mothership address to save in basic wallet
    const mnemonicObj = {
      mnemonic: mnemonic,
      hdpath: hdpath,
      mothershipAddress: mothershipAddress
    }

    // get walletFileName from user. Default to wallet.json
    let wfn = "goldenTicketWallet.json"
    if (result.walletFileName) wfn = `${result.walletFileName}.json`

    // Write out the basic wallet into a json file for other scripts  to use.
    fs.writeFile(`${wfn}`, JSON.stringify(mnemonicObj, null, 2), err => {
      if (err) return console.error(err)

      console.log(chalk.green("All done."), emoji.get(":white_check_mark:"))
      console.log(emoji.get(":rocket:"), `${wfn} written successfully.`)
    })
  })
}

main()

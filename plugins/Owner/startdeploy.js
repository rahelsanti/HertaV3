import fetch from 'node-fetch'

let handler = async (m) => {
  const githubToken = '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' // GANTI dengan token GitHub kamu yang punya repo access
  const owner = 'SanzXtech'     // GANTI dengan username GitHub kamu
  const repo = 'HertaV3'        // GANTI dengan nama repo kamu

  try {
    let res = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/dispatches`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        ref: 'master' // cabang utama
      })
    })

    if (res.ok) {
      m.reply('🚀 Deploy ke Heroku dimulai melalui GitHub Actions!')
    } else {
      const err = await res.json()
      throw new Error(`Status: ${res.status}\n${JSON.stringify(err)}`)
    }
  } catch (e) {
    console.error(e)
    m.reply(`❌ Gagal memulai deploy: ${e.message}`)
  }
}

handler.help = ['startdeploy']
handler.tags = ['owner']
handler.command = /^startdeploy$/i
handler.owner = true

export default handler
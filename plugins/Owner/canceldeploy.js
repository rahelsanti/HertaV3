import fetch from 'node-fetch'

let handler = async (m) => {
  const githubToken = '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' // GANTI dengan token GitHub kamu
  const owner = 'SanzXtech'     // GANTI dengan username GitHub kamu
  const repo = 'HertaV3'        // GANTI dengan nama repo kamu

  try {
    // Ambil daftar workflow runs
    let runs = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/workflows/deploy.yml/runs`, {
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github+json'
      }
    }).then(res => res.json())

    if (!runs.workflow_runs || runs.workflow_runs.length === 0) {
      throw new Error('Tidak ada workflow yang ditemukan.')
    }

    // Cari yang statusnya "in_progress" atau "queued"
    const running = runs.workflow_runs.find(run => ['in_progress', 'queued'].includes(run.status))
    if (!running) {
      m.reply('✅ Tidak ada workflow "deploy.yml" yang sedang berjalan.')
      return
    }

    // Batalkan workflow run yang ditemukan
    let cancel = await fetch(`https://api.github.com/repos/${owner}/${repo}/actions/runs/${running.id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github+json'
      }
    })

    if (cancel.ok) {
      m.reply(`❌ Workflow deploy.yml dengan ID ${running.id} berhasil dibatalkan!`)
    } else {
      throw new Error(`Gagal membatalkan workflow. Status: ${cancel.status}`)
    }
  } catch (e) {
    console.error(e)
    m.reply(`⚠️ Gagal membatalkan deploy: ${e.message}`)
  }
}

handler.help = ['canceldeploy']
handler.tags = ['owner']
handler.command = /^canceldeploy$/i
handler.owner = true

export default handler
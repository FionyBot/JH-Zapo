export default {
  name: 'ping',
  tags: 'general',
  description: 'Cek apakah bot hidup',
  async run(ctx) {
    const start = Date.now()
    await ctx.reply(`pong 🏓 (${Date.now() - start}ms)`)
  }
}

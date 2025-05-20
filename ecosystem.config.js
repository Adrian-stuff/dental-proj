module.exports = {
  apps: [{
    script: 'bun',
    args: 'run preview --host',
    watch: '.'
  }],

  deploy: {
    production: {
      user: 'SSH_USERNAME',
      host: 'SSH_HOSTMACHINE',
      ref: 'origin/master',
      repo: 'GIT_REPOSITORY',
      path: 'DESTINATION_PATH',
      'pre-deploy-local': '',
      'post-deploy': 'bun install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};

const router = require('express').Router();
const { handleError } = require('../lib/http');
const { runCycle } = require('../orchestrator/cycle');

// The autonomous loop: one pass over every live campaign, doing each prospect's next step. Body: { max_actions?, dry_run? }.
// OFF by default: unless global_settings.autonomous_mode is true this returns immediately with
// { ran: false, reason: 'autonomous_mode_off' } and calls nothing. Also { ran: false, reason } for 'kill_switch_on' and
// 'cycle_already_running'. Nothing in this codebase calls it on a schedule: a person or a cron has to POST here.
// dry_run: true returns what it WOULD do without doing it (still only when autonomous mode is on).
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    res.json(await runCycle({ maxActions: body.max_actions, dryRun: body.dry_run === true }));
  } catch (err) {
    handleError(res, err);
  }
});

module.exports = router;

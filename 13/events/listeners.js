// Practical 10: Event Listeners Module
// Implements asynchronous background listeners for task-created, task-deleted, task-updated, and error events

import taskEvents from './taskEvents.js';

const DEFAULT_DELAY_MS = parseInt(process.env.NOTIFICATION_DELAY_MS || '1500', 10);

/**
 * Register all event listeners for the application
 */
export function registerTaskListeners() {
  console.log('📡 [Event Subsystem] Registering background task event listeners...');

  // -------------------------------------------------------------
  // 1. Task Created Listener (Simulates Background Email / Push Notification)
  // -------------------------------------------------------------
  taskEvents.on('task-created', (payload) => {
    const { task, user, apiSentAt, delayMs } = payload || {};
    const taskTitle = task?.title || 'Untitled Task';
    const userName = user?.name || user?.email || 'Unknown User';
    const taskId = task?._id || task?.id || 'N/A';
    const startMs = Date.now();
    const listenerStartedAt = new Date().toISOString();
    const simulatedDelay = delayMs !== undefined ? delayMs : DEFAULT_DELAY_MS;

    console.log(`[Notification Listener] Task "${taskTitle}" created at ${listenerStartedAt}`);
    console.log(`  └─ User: ${userName} | Task ID: ${taskId}`);
    console.log(`  └─ [PROOF] Main API Response was already dispatched at: ${apiSentAt}`);

    // Asynchronous non-blocking worker with artificial delay
    setTimeout(() => {
      try {
        const listenerCompletedAt = new Date().toISOString();
        const durationMs = Date.now() - startMs;
        console.log(`[Notification Listener] Background email notification sent for "${taskTitle}" at ${listenerCompletedAt} (processing took ${durationMs}ms)`);

        // Record telemetry for live UI inspectability
        taskEvents.recordEvent({
          event: 'task-created',
          taskTitle,
          taskId: String(taskId),
          userName,
          apiSentAt,
          listenerStartedAt,
          listenerCompletedAt,
          durationMs,
          status: 'completed',
          message: `Simulated background email dispatched to ${userName}`
        });
      } catch (err) {
        taskEvents.emit('error', err);
      }
    }, simulatedDelay);
  });

  // -------------------------------------------------------------
  // 2. Task Deleted Listener (Supplementary Problem 1: Audit Archival)
  // -------------------------------------------------------------
  taskEvents.on('task-deleted', (payload) => {
    const { task, user, apiSentAt, delayMs } = payload || {};
    const taskTitle = task?.title || 'Untitled Task';
    const taskId = task?._id || task?.id || 'N/A';
    const userName = user?.name || user?.email || 'System';
    const startMs = Date.now();
    const listenerStartedAt = new Date().toISOString();
    const simulatedDelay = delayMs !== undefined ? delayMs : 800;

    console.log(`[Audit Listener] Task "${taskTitle}" (ID: ${taskId}) deleted at ${listenerStartedAt} by ${userName}`);
    console.log(`  └─ [PROOF] Main API 200 OK was already sent at: ${apiSentAt}`);

    setTimeout(() => {
      try {
        const listenerCompletedAt = new Date().toISOString();
        const durationMs = Date.now() - startMs;
        console.log(`[Audit Listener] Audit archival completed for deleted task "${taskTitle}" at ${listenerCompletedAt}`);

        taskEvents.recordEvent({
          event: 'task-deleted',
          taskTitle,
          taskId: String(taskId),
          userName,
          apiSentAt,
          listenerStartedAt,
          listenerCompletedAt,
          durationMs,
          status: 'completed',
          message: `Audit log archived for deleted task "${taskTitle}"`
        });
      } catch (err) {
        taskEvents.emit('error', err);
      }
    }, simulatedDelay);
  });

  // -------------------------------------------------------------
  // 3. Task Updated Listener (Lifecycle Notification)
  // -------------------------------------------------------------
  taskEvents.on('task-updated', (payload) => {
    const { task, user, apiSentAt } = payload || {};
    const taskTitle = task?.title || 'Untitled Task';
    const taskId = task?._id || task?.id || 'N/A';
    const listenerStartedAt = new Date().toISOString();

    console.log(`[Notification Listener] Task "${taskTitle}" (ID: ${taskId}) updated at ${listenerStartedAt}`);

    taskEvents.recordEvent({
      event: 'task-updated',
      taskTitle,
      taskId: String(taskId),
      userName: user?.name || 'User',
      apiSentAt,
      listenerStartedAt,
      listenerCompletedAt: listenerStartedAt,
      durationMs: 0,
      status: 'completed',
      message: `Task "${taskTitle}" metadata updated`
    });
  });

  // -------------------------------------------------------------
  // 4. Error Listener (Supplementary Problem 2: Catches Background Failures)
  // -------------------------------------------------------------
  // CRITICAL: Unhandled 'error' events crash the Node.js process.
  // Registering this listener ensures background failures are logged safely.
  taskEvents.on('error', (err) => {
    const timestamp = new Date().toISOString();
    console.error(`💥 [Event Error Listener] Handled asynchronous event error at ${timestamp}:`, err.message);

    taskEvents.recordEvent({
      event: 'error',
      taskTitle: 'N/A',
      taskId: 'N/A',
      userName: 'System',
      apiSentAt: timestamp,
      listenerStartedAt: timestamp,
      listenerCompletedAt: timestamp,
      durationMs: 0,
      status: 'error',
      message: err.message || 'Background worker error caught cleanly'
    });
  });

  console.log('✅ [Event Subsystem] All event listeners registered successfully.');
}

export default registerTaskListeners;

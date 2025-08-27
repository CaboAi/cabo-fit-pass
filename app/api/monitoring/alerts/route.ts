import { NextRequest, NextResponse } from 'next/server';
import { alertManager, createAlert } from '@/lib/monitoring/alerting-system';
import { createMonitoringLogger } from '@/lib/monitoring/enhanced-logger';
import { withPerformanceMonitoring } from '@/lib/monitoring/performance-middleware';

const logger = createMonitoringLogger('monitoring-api');

/**
 * Get alerts and alerting statistics
 */
async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'stats':
        return NextResponse.json({
          success: true,
          data: alertManager.getStats(),
        });

      case 'active':
        return NextResponse.json({
          success: true,
          data: alertManager.getActiveAlerts(),
        });

      default:
        return NextResponse.json({
          success: true,
          data: {
            stats: alertManager.getStats(),
            activeAlerts: alertManager.getActiveAlerts(),
          },
        });
    }
  } catch (error) {
    logger.error('Failed to get alerts', {
      component: 'monitoring-api',
      action: 'get-alerts',
    }, error as Error);

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve alerts',
    }, { status: 500 });
  }
}

/**
 * Create a new alert
 */
async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { level, title, message, component, metadata } = body;

    // Validate required fields
    if (!level || !title || !message || !component) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: level, title, message, component',
      }, { status: 400 });
    }

    // Validate alert level
    if (!['info', 'warning', 'error', 'critical'].includes(level)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid alert level. Must be: info, warning, error, or critical',
      }, { status: 400 });
    }

    const alertId = await createAlert(level, title, message, component, metadata);

    logger.info('Alert created via API', {
      component: 'monitoring-api',
      action: 'create-alert',
      metadata: { alertId, level, component },
    });

    return NextResponse.json({
      success: true,
      data: {
        alertId,
        message: 'Alert created successfully',
      },
    });
  } catch (error) {
    logger.error('Failed to create alert', {
      component: 'monitoring-api',
      action: 'create-alert',
    }, error as Error);

    return NextResponse.json({
      success: false,
      error: 'Failed to create alert',
    }, { status: 500 });
  }
}

/**
 * Resolve an alert
 */
async function PATCH(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const alertId = url.searchParams.get('alertId');

    if (!alertId) {
      return NextResponse.json({
        success: false,
        error: 'Alert ID is required',
      }, { status: 400 });
    }

    const resolved = alertManager.resolveAlert(alertId);

    if (!resolved) {
      return NextResponse.json({
        success: false,
        error: 'Alert not found or already resolved',
      }, { status: 404 });
    }

    logger.info('Alert resolved via API', {
      component: 'monitoring-api',
      action: 'resolve-alert',
      metadata: { alertId },
    });

    return NextResponse.json({
      success: true,
      data: {
        message: 'Alert resolved successfully',
      },
    });
  } catch (error) {
    logger.error('Failed to resolve alert', {
      component: 'monitoring-api',
      action: 'resolve-alert',
    }, error as Error);

    return NextResponse.json({
      success: false,
      error: 'Failed to resolve alert',
    }, { status: 500 });
  }
}

// Apply performance monitoring
export const GET_MONITORED = withPerformanceMonitoring(GET, {
  component: 'monitoring-api',
  operationName: 'get-alerts',
});

export const POST_MONITORED = withPerformanceMonitoring(POST, {
  component: 'monitoring-api',
  operationName: 'create-alert',
});

export const PATCH_MONITORED = withPerformanceMonitoring(PATCH, {
  component: 'monitoring-api',
  operationName: 'resolve-alert',
});

export { GET_MONITORED as GET, POST_MONITORED as POST, PATCH_MONITORED as PATCH };
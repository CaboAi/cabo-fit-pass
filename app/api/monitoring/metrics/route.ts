import { NextRequest, NextResponse } from 'next/server';
import { getPerformanceMetrics } from '@/lib/monitoring/performance-middleware';
import { businessMetrics } from '@/lib/monitoring/business-metrics';
import { updateMetric, evaluateAlerts } from '@/lib/monitoring/alerting-system';
import { createMonitoringLogger } from '@/lib/monitoring/enhanced-logger';
import { withPerformanceMonitoring } from '@/lib/monitoring/performance-middleware';

const logger = createMonitoringLogger('metrics-api');

/**
 * Get monitoring metrics
 */
async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    const response: any = {
      success: true,
      timestamp: new Date().toISOString(),
      data: {},
    };

    switch (type) {
      case 'performance':
        response.data = getPerformanceMetrics();
        break;

      case 'business':
        response.data = businessMetrics.getMetricsSummary();
        break;

      case 'all':
      default:
        response.data = {
          performance: getPerformanceMetrics(),
          business: businessMetrics.getMetricsSummary(),
          system: await getSystemMetrics(),
        };
        break;
    }

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to get metrics', {
      component: 'metrics-api',
      action: 'get-metrics',
    }, error as Error);

    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve metrics',
    }, { status: 500 });
  }
}

/**
 * Update metric values and trigger alert evaluation
 */
async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { metrics, evaluateRules = false } = body;

    if (!metrics || typeof metrics !== 'object') {
      return NextResponse.json({
        success: false,
        error: 'Metrics object is required',
      }, { status: 400 });
    }

    // Update metrics
    for (const [key, value] of Object.entries(metrics)) {
      updateMetric(key, value);
    }

    logger.info('Metrics updated via API', {
      component: 'metrics-api',
      action: 'update-metrics',
      metadata: {
        metricCount: Object.keys(metrics).length,
        evaluateRules,
      },
    });

    // Evaluate alert rules if requested
    if (evaluateRules) {
      await evaluateAlerts();
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Metrics updated successfully',
        updatedCount: Object.keys(metrics).length,
      },
    });
  } catch (error) {
    logger.error('Failed to update metrics', {
      component: 'metrics-api',
      action: 'update-metrics',
    }, error as Error);

    return NextResponse.json({
      success: false,
      error: 'Failed to update metrics',
    }, { status: 500 });
  }
}

/**
 * Get system metrics
 */
async function getSystemMetrics() {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memory: {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      usagePercentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    },
    cpu: {
      user: cpuUsage.user,
      system: cpuUsage.system,
    },
    uptime: process.uptime(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    timestamp: new Date().toISOString(),
  };
}

// Apply performance monitoring
export const GET_MONITORED = withPerformanceMonitoring(GET, {
  component: 'metrics-api',
  operationName: 'get-metrics',
});

export const POST_MONITORED = withPerformanceMonitoring(POST, {
  component: 'metrics-api',
  operationName: 'update-metrics',
});

export { GET_MONITORED as GET, POST_MONITORED as POST };
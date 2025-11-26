/**
 * Email Marketing System Index
 * Semana 32: Sistema completo de email marketing y automatización
 */

// Templates
export {
  getEmailTemplateBuilder,
  initializeEmailTemplateBuilder,
  type EmailTemplate,
  type EmailBlock,
} from './templates'

// Campaigns
export {
  getEmailCampaignManager,
  initializeEmailCampaignManager,
  type EmailCampaign,
  type CampaignStatus,
} from './campaigns'

// Subscribers
export {
  getSubscriberManager,
  initializeSubscriberManager,
  type Subscriber,
  type SubscriberList,
  type Segment,
} from './subscribers'

// Analytics
export {
  getEmailAnalyticsTracker,
  initializeEmailAnalyticsTracker,
  type EmailEvent,
  type EmailStats,
} from './analytics'

// A/B Testing
export {
  getABTestManager,
  initializeABTestManager,
  type ABTest,
} from './ab-testing'

// Workflows
export {
  getWorkflowManager,
  initializeWorkflowManager,
  type EmailWorkflow,
  type WorkflowTrigger,
} from './workflows'

// Unsubscribe Management
export {
  getUnsubscribeManager,
  initializeUnsubscribeManager,
  type UnsubscribeReason,
  type PreferenceCenter,
} from './unsubscribe'

// Bounce Handling
export {
  getBounceHandler,
  initializeBounceHandler,
  type BounceRecord,
  type BounceType,
} from './bounce-handler'

// Advanced Editor
export {
  getAdvancedTemplateEditor,
  initializeAdvancedTemplateEditor,
  type TemplateElement,
} from './advanced-editor'

// Deliverability
export {
  getDeliverabilityManager,
  initializeDeliverabilityManager,
  type DeliverabilityConfig,
  type DeliverabilityScore,
} from './deliverability'

// GDPR Compliance
export {
  getGDPRComplianceManager,
  initializeGDPRComplianceManager,
  type ConsentRecord,
  type DataSubjectRequest,
} from './gdpr'

// Integrations
export {
  getEmailIntegrationManager,
  initializeEmailIntegrationManager,
  type EmailProvider,
  type SendEmailOptions,
} from './integrations'

/**
 * Inicializar todo el sistema de email marketing
 */
export function initializeEmailMarketing(config?: {
  providers?: { resend?: string; sendgrid?: string; mailchimp?: string }
  defaultProvider?: 'resend' | 'sendgrid' | 'mailchimp'
}) {
  const {
    initializeEmailTemplateBuilder,
    initializeEmailCampaignManager,
    initializeSubscriberManager,
    initializeEmailAnalyticsTracker,
    initializeABTestManager,
    initializeWorkflowManager,
    initializeUnsubscribeManager,
    initializeBounceHandler,
    initializeAdvancedTemplateEditor,
    initializeDeliverabilityManager,
    initializeGDPRComplianceManager,
    initializeEmailIntegrationManager,
  } = require('./index.ts')

  // Inicializar todos los módulos
  initializeEmailTemplateBuilder()
  initializeEmailCampaignManager()
  initializeSubscriberManager()
  initializeEmailAnalyticsTracker()
  initializeABTestManager()
  initializeWorkflowManager()
  initializeUnsubscribeManager()
  initializeBounceHandler()
  initializeAdvancedTemplateEditor()
  initializeDeliverabilityManager()
  initializeGDPRComplianceManager()

  // Configurar proveedores de email
  const integrations = initializeEmailIntegrationManager()

  if (config?.providers?.resend) {
    integrations.configureProvider('resend', config.providers.resend)
  }
  if (config?.providers?.sendgrid) {
    integrations.configureProvider('sendgrid', config.providers.sendgrid)
  }
  if (config?.providers?.mailchimp) {
    integrations.configureProvider('mailchimp', config.providers.mailchimp)
  }

  console.log('[Email Marketing] Sistema inicializado correctamente')

  return {
    templates: 'initialized',
    campaigns: 'initialized',
    subscribers: 'initialized',
    analytics: 'initialized',
    abTesting: 'initialized',
    workflows: 'initialized',
    unsubscribe: 'initialized',
    bounceHandling: 'initialized',
    advancedEditor: 'initialized',
    deliverability: 'initialized',
    gdprCompliance: 'initialized',
    integrations: 'initialized',
  }
}

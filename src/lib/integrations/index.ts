// Integrations Index
// Export all third-party service integrations

// Email
export {
  emailService,
  createEmailService,
  ResendEmailService,
  EmailSchema,
  EmailRecipientSchema,
  type Email,
  type EmailRecipient,
  type EmailTemplate,
  type EmailService,
} from "./email";

// Analytics
export {
  analytics,
  createAnalyticsService,
  GoogleAnalyticsService,
  ServerAnalyticsService,
  TrackEventSchema,
  PageViewSchema,
  EventPropertiesSchema,
  type TrackEvent,
  type PageView,
  type EventProperties,
  type EcommerceEvent,
  type AnalyticsService,
} from "./analytics";

// Storage
export {
  storage,
  createStorageService,
  CloudinaryStorageService,
  S3StorageService,
  UploadOptionsSchema,
  type UploadOptions,
  type UploadResult,
  type StorageService,
} from "./storage";

// Payments
export {
  paymentService,
  createPaymentService,
  StripePaymentService,
  PaymentIntentSchema,
  RefundSchema,
  type PaymentIntent,
  type Refund,
  type PaymentIntentResult,
  type RefundResult,
  type PaymentStatus,
  type PaymentCustomer,
  type PaymentMethod,
  type PaymentService,
} from "./payments";

// Search
export {
  searchService,
  createSearchService,
  AlgoliaSearchService,
  InMemorySearchService,
  SearchQuerySchema,
  type SearchQuery,
  type SearchResult,
  type SearchHit,
  type FacetResult,
  type ProductSearchData,
  type SearchService,
} from "./search";

// Notifications
export {
  notificationService,
  createNotificationService,
  FCMNotificationService,
  NotificationSchema,
  NotificationTargetSchema,
  type Notification,
  type NotificationTarget,
  type NotificationResult,
  type PushSubscription,
  type InAppNotification,
  type NotificationService,
} from "./notifications";

// Re-export all services as a bundle
export const integrations = {
  email: () => import("./email").then((m) => m.emailService),
  analytics: () => import("./analytics").then((m) => m.analytics),
  storage: () => import("./storage").then((m) => m.storage),
  payments: () => import("./payments").then((m) => m.paymentService),
  search: () => import("./search").then((m) => m.searchService),
  notifications: () => import("./notifications").then((m) => m.notificationService),
};

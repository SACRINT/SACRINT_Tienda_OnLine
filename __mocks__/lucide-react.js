// Mock for lucide-react icons
const React = require("react");

const createMockIcon = (name) => {
  const MockIcon = (props) =>
    React.createElement("svg", {
      ...props,
      "data-testid": `\${name.toLowerCase()}-icon`,
      "data-lucide": name.toLowerCase(),
    });
  MockIcon.displayName = name;
  return MockIcon;
};

module.exports = {
  Star: createMockIcon("Star"),
  ThumbsUp: createMockIcon("ThumbsUp"),
  ThumbsDown: createMockIcon("ThumbsDown"),
  BadgeCheck: createMockIcon("BadgeCheck"),
  MoreVertical: createMockIcon("MoreVertical"),
  X: createMockIcon("X"),
  Upload: createMockIcon("Upload"),
  Loader2: createMockIcon("Loader2"),
  ChevronDown: createMockIcon("ChevronDown"),
  Check: createMockIcon("Check"),
  Search: createMockIcon("Search"),
  Filter: createMockIcon("Filter"),
  Plus: createMockIcon("Plus"),
  Minus: createMockIcon("Minus"),
  Trash2: createMockIcon("Trash2"),
  Edit: createMockIcon("Edit"),
  Eye: createMockIcon("Eye"),
  EyeOff: createMockIcon("EyeOff"),
  Calendar: createMockIcon("Calendar"),
  Clock: createMockIcon("Clock"),
  MapPin: createMockIcon("MapPin"),
  Mail: createMockIcon("Mail"),
  Phone: createMockIcon("Phone"),
  User: createMockIcon("User"),
  Users: createMockIcon("Users"),
  Settings: createMockIcon("Settings"),
  LogOut: createMockIcon("LogOut"),
  ShoppingCart: createMockIcon("ShoppingCart"),
  Heart: createMockIcon("Heart"),
  Package: createMockIcon("Package"),
  Truck: createMockIcon("Truck"),
  CreditCard: createMockIcon("CreditCard"),
  DollarSign: createMockIcon("DollarSign"),
  TrendingUp: createMockIcon("TrendingUp"),
  TrendingDown: createMockIcon("TrendingDown"),
  AlertCircle: createMockIcon("AlertCircle"),
  CheckCircle: createMockIcon("CheckCircle"),
  Info: createMockIcon("Info"),
  XCircle: createMockIcon("XCircle"),
};

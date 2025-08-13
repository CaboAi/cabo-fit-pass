# Mobile PWA Improvements Needed

## Current Analysis:
✅ **Good mobile patterns already in place:**
- Navigation header has mobile menu with hamburger
- Dashboard grid: `grid-cols-1 lg:grid-cols-12` (stacks on mobile)
- Class cards: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` (single column on mobile)
- PaymentModal: `grid-cols-1 md:grid-cols-3` (stacks on mobile)
- Search bar: `flex-col sm:flex-row` (stacks on mobile)
- Responsive padding: `p-4`, `p-6`, `p-8`

❌ **Issues to fix:**
1. PaymentModal header could overflow on small screens
2. Trust indicators in PaymentModal could be too crowded on mobile
3. Grid cards inside Welcome card (3-column stats) might be too tight
4. Dashboard padding could be optimized for mobile
5. Typography might be too large on small screens
6. Touch targets could be optimized

## Specific Improvements:

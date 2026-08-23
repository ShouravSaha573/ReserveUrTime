# LISTING_CHANGE_APPROVAL.md

## Ownership boundary

Platform-owned public listing identity:
- `Restaurant.name`
- `Restaurant.coverImageUrl`

Restaurant-owned internal profile:
- `RestaurantProfile.tagline`
- `RestaurantProfile.aboutTitle`
- `RestaurantProfile.aboutBody`
- `RestaurantProfile.reservationNote`
- `RestaurantProfile.internalPhone`
- `RestaurantProfile.internalEmail`
- `RestaurantProfile.internalOpeningHours`
- `RestaurantProfile.websiteUrl`

## Request flow

```text
Restaurant Admin
   ↓
Proposes Restaurant name OR listing image
   ↓
ListingChangeRequest(status=pending)
   ↓
Platform Admin approval inbox
   ├── Reject → status=rejected
   └── Approve
         ↓
     MongoDB transaction
         ↓
Restaurant.name OR Restaurant.coverImageUrl updated
         +
request.status=approved
         ↓
Next public Restaurant API read shows the new value
```

Only one pending request per Restaurant + request type is allowed at a time.

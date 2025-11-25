# Backup & Disaster Recovery Plan

## Database Backups

### Neon Automatic Backups

- Daily backups (7 days retention)
- Point-in-time recovery available
- Stored in Neon infrastructure

### Manual Backups

```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Upload to S3/cloud storage (future)
```

## Code Backup

- GitHub repository (primary)
- Multiple team members have access
- Protected main branch
- Tag releases

## Recovery Procedures

### Database Restore

1. Access Neon dashboard
2. Select backup point
3. Restore to new instance
4. Update connection string
5. Verify data integrity

### Full System Recovery

1. Clone GitHub repository
2. Install dependencies
3. Configure environment variables
4. Restore database
5. Deploy to Vercel
6. Verify functionality

## Recovery Objectives

- RTO (Recovery Time Objective): < 1 hour
- RPO (Recovery Point Objective): < 24 hours

## Testing

- Quarterly recovery drill
- Document actual recovery time
- Update procedures as needed

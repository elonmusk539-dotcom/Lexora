- [ ] Verify table created with correct columns
- [ ] Check RLS policies are enabled
- [ ] Verify indexes created

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ Server-side only!

### Testing
- [ ] Create test subscription
- [ ] Verify record appears in subscriptions table
- [ ] Check user gains Pro access
- [ ] Test subscription cancellation
- [ ] Verify access removed after period ends

---

## Support & Troubleshooting

### User Shows as Free Despite Payment
1. Check subscriptions table for user_id
2. Verify status = 'active'
3. Check current_period_end > NOW()
4. Review API logs for webhook errors

### Subscription Not Saving
1. Check API route logs
2. Verify SUPABASE_SERVICE_ROLE_KEY is set
3. Check RLS policies allow service role inserts

### Need to Manually Grant Pro Access
```sql
INSERT INTO subscriptions (user_id, status, current_period_end)
VALUES ('USER_UUID', 'active', NOW() + INTERVAL '1 year')
ON CONFLICT (user_id) 
DO UPDATE SET status = 'active', current_period_end = NOW() + INTERVAL '1 year';
```

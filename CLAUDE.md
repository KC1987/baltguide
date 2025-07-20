## Database Knowledge
- Study Supabase documentation on working with JSONB arrays at https://supabase.com/docs/guides/database/json?queryGroups=database-method&database-method=dashboard&queryGroups=language&language=js
- Comprehensive guide created on working with JSONB arrays in Supabase, covering everything from basic array creation to advanced querying techniques and performance optimization

## JSONB Array Filtering Implementation

### 1. Understanding Data Structure is Critical
- Always inspect actual database structure first (CSV export was invaluable)
- JSONB arrays can be stored as jsonb[] (array of JSONB) vs jsonb (single JSONB containing array)
- Different storage types require completely different query approaches

### 2. JSONB Array Query Patterns
- For jsonb[] type: Use = ANY(array_column) with to_jsonb(filter_value)
- For single jsonb arrays: Use @>, &&, or ?| operators
- Always convert TEXT[] filters to JSONB format for comparison

### 3. OR vs AND Logic in Filtering
- Users typically expect OR logic within filter categories (show locations with ANY selected category)
- Use EXISTS with unnest() for proper OR implementation
- @> operator implements AND logic (all values must be present)

### 4. Supabase RPC Function Best Practices
- Always handle NULL filters to make parameters optional
- Use consistent parameter naming conventions
- Grant proper permissions (anon, authenticated)
- Drop existing functions before creating new ones to avoid signature conflicts

### 5. Debugging Strategies
- Add console logging to frontend to inspect actual parameter values
- Create diagnostic functions to examine database structure
- Test with simplified versions first (remove array filters, then add back)
- Use CSV exports to understand exact data format

### 6. Performance Considerations
- Consider GIN indexes for JSONB array columns if queries become slow
- Use PostGIS functions efficiently for distance calculations
- Limit results appropriately to avoid excessive data transfer
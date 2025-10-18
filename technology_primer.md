# Technology Primer: User Profile Management in Dokploy

## Issue #6: Add Name Field to User Profile Form

This primer covers the key technologies, frameworks, and concepts you need to understand to implement the user name field feature in Dokploy.

## Core Technologies

### 1. Next.js 14 with App Router
**What it is**: React framework for production with file-based routing
**Key concepts for this issue**:
- **Pages**: `apps/dokploy/pages/dashboard/settings/profile.tsx`
- **Components**: Reusable UI components in `apps/dokploy/components/`
- **API Routes**: Server-side logic in `apps/dokploy/server/api/`

**Relevant patterns**:
```typescript
// Page component
const Page = () => {
    const { data } = api.user.get.useQuery();
    return <ProfileForm />;
};

// Component with hooks
export const ProfileForm = () => {
    const { data, refetch } = api.user.get.useQuery();
    const { mutateAsync } = api.user.update.useMutation();
    // ... component logic
};
```

### 2. tRPC (TypeScript Remote Procedure Call)
**What it is**: End-to-end typesafe APIs with TypeScript
**Key concepts for this issue**:
- **Procedures**: `query` (read) and `mutation` (write) operations
- **Routers**: Organized API endpoints (`userRouter`, `projectRouter`, etc.)
- **Client**: Type-safe API calls from frontend

**Relevant patterns**:
```typescript
// Backend router
export const userRouter = createTRPCRouter({
    get: protectedProcedure.query(async ({ ctx }) => {
        return await findUserById(ctx.user.id);
    }),
    update: protectedProcedure
        .input(apiUpdateUser)
        .mutation(async ({ input, ctx }) => {
            return await updateUser(ctx.user.id, input);
        }),
});

// Frontend usage
const { data } = api.user.get.useQuery();
const { mutateAsync } = api.user.update.useMutation();
```

### 3. React Hook Form
**What it is**: Performant, flexible forms with easy validation
**Key concepts for this issue**:
- **useForm**: Main hook for form management
- **FormField**: Controlled form fields
- **Validation**: Zod schema integration

**Relevant patterns**:
```typescript
const form = useForm<Profile>({
    defaultValues: {
        name: data?.user?.name || "",
        email: data?.user?.email || "",
    },
    resolver: zodResolver(profileSchema),
});

<FormField
    control={form.control}
    name="name"
    render={({ field }) => (
        <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
                <Input placeholder="Enter your name" {...field} />
            </FormControl>
            <FormMessage />
        </FormItem>
    )}
/>
```

### 4. Zod Validation
**What it is**: TypeScript-first schema validation
**Key concepts for this issue**:
- **Schema Definition**: Define data structure and validation rules
- **Type Inference**: Generate TypeScript types from schemas
- **Form Integration**: Works with React Hook Form

**Relevant patterns**:
```typescript
const profileSchema = z.object({
    name: z.string().optional(),           // Optional name field
    email: z.string(),                     // Required email
    password: z.string().nullable(),        // Nullable password
});

type Profile = z.infer<typeof profileSchema>; // TypeScript type
```

### 5. Drizzle ORM
**What it is**: TypeScript ORM for SQL databases
**Key concepts for this issue**:
- **Schema Definition**: Database table definitions
- **Queries**: Type-safe database queries
- **Migrations**: Database schema changes

**Relevant patterns**:
```typescript
// Schema definition
export const users_temp = pgTable("user_temp", {
    id: text("id").notNull().primaryKey().$defaultFn(() => nanoid()),
    name: text("name").notNull().default(""),  // User name field
    email: text("email").notNull().unique(),
});

// Query usage
const user = await db.query.users_temp.findFirst({
    where: eq(users_temp.id, userId),
});
```

### 6. PostgreSQL Database
**What it is**: Relational database for data persistence
**Key concepts for this issue**:
- **Tables**: `user` table stores user information
- **Fields**: `name`, `email`, `password`, etc.
- **Constraints**: Unique email, required fields

**Relevant schema**:
```sql
CREATE TABLE user (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    -- other fields
);
```

## Framework-Specific Concepts

### 1. Authentication & Authorization
**Protected Procedures**: API endpoints that require authentication
```typescript
// Only authenticated users can access
get: protectedProcedure.query(async ({ ctx }) => {
    // ctx.user contains authenticated user info
    return await findUserById(ctx.user.id);
}),

// Only admins can access
all: adminProcedure.query(async ({ ctx }) => {
    // ctx.user.role === "owner"
    return await getAllUsers();
}),
```

### 2. Form State Management
**Form Reset**: Update form when data changes
```typescript
useEffect(() => {
    if (data) {
        form.reset({
            name: data?.user?.name || "",
            email: data?.user?.email || "",
            // ... other fields
        });
    }
}, [form, data]);
```

### 3. Error Handling
**tRPC Errors**: Structured error responses
```typescript
if (!correctPassword) {
    throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Current password is incorrect",
    });
}
```

### 4. UI Components
**Shadcn/ui**: Pre-built accessible components
```typescript
// Form components
<Form {...form}>
    <FormField control={form.control} name="name" />
    <FormMessage />  // Error display
</Form>

// Input components
<Input placeholder="Enter your name" {...field} />
<Button type="submit">Update Profile</Button>
```

## Data Flow Patterns

### 1. Read Data Flow
```
Database → Drizzle Query → tRPC Query → React Query → Component State → UI
```

### 2. Write Data Flow
```
Form Input → Zod Validation → tRPC Mutation → Database Update → Cache Invalidation → UI Update
```

### 3. Authentication Flow
```
Login → Session Creation → Token Storage → Protected Route Access → User Data Loading
```

## Key Files for This Issue

### Frontend Files
- `apps/dokploy/components/dashboard/settings/profile/profile-form.tsx` - Main profile form
- `apps/dokploy/components/layouts/user-nav.tsx` - User navigation component
- `apps/dokploy/pages/dashboard/settings/profile.tsx` - Profile page

### Backend Files
- `apps/dokploy/server/api/routers/user.ts` - User API endpoints
- `packages/server/src/db/schema/user.ts` - User database schema
- `packages/server/src/db/schema/index.ts` - Schema exports

### Configuration Files
- `apps/dokploy/server/api/root.ts` - API router configuration
- `apps/dokploy/server/api/trpc.ts` - tRPC setup

## Common Patterns

### 1. Form with Validation
```typescript
const form = useForm<Schema>({
    resolver: zodResolver(schema),
    defaultValues: { /* initial values */ }
});

const onSubmit = async (values: Schema) => {
    await mutateAsync(values);
    toast.success("Updated successfully");
};
```

### 2. Conditional Rendering
```typescript
{data?.user?.name ? (
    <span>{data.user.name}</span>
) : (
    <span>Account</span>
)}
```

### 3. Loading States
```typescript
{isLoading ? (
    <Loader2 className="animate-spin" />
) : (
    <ProfileForm />
)}
```

### 4. Error Handling
```typescript
{isError && (
    <AlertBlock type="error">
        {error?.message}
    </AlertBlock>
)}
```

## Testing Considerations

### 1. Unit Tests
- Form validation logic
- API endpoint behavior
- Component rendering

### 2. Integration Tests
- Form submission flow
- Database updates
- Authentication flow

### 3. E2E Tests
- Complete user profile update flow
- UI state changes
- Error scenarios

## Performance Considerations

### 1. Form Optimization
- Debounced input validation
- Memoized form components
- Efficient re-renders

### 2. API Optimization
- Cached queries
- Optimistic updates
- Error retry logic

### 3. Database Optimization
- Indexed queries
- Connection pooling
- Query optimization

## Security Best Practices

### 1. Input Validation
- Zod schema validation
- SQL injection prevention
- XSS protection

### 2. Authentication
- Password hashing (bcrypt)
- Session management
- CSRF protection

### 3. Authorization
- Role-based access control
- Resource-level permissions
- API endpoint protection

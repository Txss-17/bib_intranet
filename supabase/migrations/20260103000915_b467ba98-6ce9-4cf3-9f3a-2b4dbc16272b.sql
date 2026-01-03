-- Enable realtime for critical tables
-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'executive', 'manager', 'analyst', 'operator', 'viewer');

-- Create notification_type enum
CREATE TYPE public.notification_type AS ENUM ('info', 'warning', 'success', 'critical');

-- Create pole_id enum
CREATE TYPE public.pole_id AS ENUM (
  'direction', 'finance', 'ops', 'tech', 'rh', 'supplier',
  'audit', 'compliance', 'rse', 'marketing', 'risk', 'lifecycle'
);

-- Create whistleblower_status enum
CREATE TYPE public.whistleblower_status AS ENUM ('pending', 'under_review', 'investigating', 'resolved', 'closed');

-- Create message_status enum
CREATE TYPE public.message_status AS ENUM ('pending', 'validated', 'routed', 'responded', 'archived');

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  avatar_url TEXT,
  seniority TEXT DEFAULT 'mid',
  poles pole_id[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Notifications table with realtime support
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type notification_type DEFAULT 'info',
  pole_id pole_id,
  read BOOLEAN DEFAULT false,
  action_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Inter-pole messages table
CREATE TABLE public.inter_pole_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_pole pole_id NOT NULL,
  to_pole pole_id NOT NULL,
  from_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT DEFAULT 'normal',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.inter_pole_messages REPLICA IDENTITY FULL;

-- Ethics & Whistleblowing submissions (anonymous, encrypted)
CREATE TABLE public.whistleblower_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_code TEXT UNIQUE NOT NULL, -- For anonymous tracking
  encrypted_content TEXT NOT NULL, -- Encrypted submission content
  category TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  status whistleblower_status DEFAULT 'pending',
  assigned_auditor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Whistleblower submission updates (for tracking without revealing identity)
CREATE TABLE public.whistleblower_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES public.whistleblower_submissions(id) ON DELETE CASCADE,
  update_text TEXT NOT NULL,
  is_auditor_update BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- External messages (Gateway module)
CREATE TABLE public.external_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  status message_status DEFAULT 'pending',
  routed_to_pole pole_id,
  validated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  validation_notes TEXT,
  response_content TEXT,
  responded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.external_messages REPLICA IDENTITY FULL;

-- Message routing log
CREATE TABLE public.message_routing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES public.external_messages(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  from_status message_status,
  to_status message_status,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Audit log for all actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  pole_id pole_id,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inter_pole_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whistleblower_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whistleblower_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_routing_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (auth.uid() = id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "System can create notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (true);

-- RLS Policies for inter_pole_messages
CREATE POLICY "Users can view messages for their poles"
ON public.inter_pole_messages FOR SELECT TO authenticated
USING (true); -- Further filtering done in application based on pole membership

CREATE POLICY "Users can send inter-pole messages"
ON public.inter_pole_messages FOR INSERT TO authenticated
WITH CHECK (from_user_id = auth.uid());

-- RLS Policies for whistleblower_submissions (accessible only by auditors)
CREATE POLICY "Auditors can view whistleblower submissions"
ON public.whistleblower_submissions FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  assigned_auditor_id = auth.uid()
);

CREATE POLICY "Anyone can create whistleblower submissions"
ON public.whistleblower_submissions FOR INSERT TO authenticated
WITH CHECK (true);

CREATE POLICY "Auditors can update whistleblower submissions"
ON public.whistleblower_submissions FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR
  assigned_auditor_id = auth.uid()
);

-- RLS Policies for whistleblower_updates
CREATE POLICY "Auditors can view whistleblower updates"
ON public.whistleblower_updates FOR SELECT TO authenticated
USING (true); -- Anonymous users track via code

CREATE POLICY "Anyone can create whistleblower updates"
ON public.whistleblower_updates FOR INSERT TO authenticated
WITH CHECK (true);

-- RLS Policies for external_messages
CREATE POLICY "Authorized users can view external messages"
ON public.external_messages FOR SELECT TO authenticated
USING (true); -- Role-based filtering in application

CREATE POLICY "Authorized users can manage external messages"
ON public.external_messages FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager'));

-- RLS Policies for message_routing_log
CREATE POLICY "Users can view message routing logs"
ON public.message_routing_log FOR SELECT TO authenticated
USING (true);

CREATE POLICY "System can create routing logs"
ON public.message_routing_log FOR INSERT TO authenticated
WITH CHECK (true);

-- RLS Policies for audit_logs
CREATE POLICY "Users can view relevant audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (true);

CREATE POLICY "System can create audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_whistleblower_submissions_updated_at
BEFORE UPDATE ON public.whistleblower_submissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_external_messages_updated_at
BEFORE UPDATE ON public.external_messages
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'New'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
  );
  
  -- Assign default 'viewer' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'viewer');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.inter_pole_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.external_messages;
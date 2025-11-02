
CREATE TYPE public.app_role AS ENUM ('admin', 'user');


CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);


CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);


ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);


CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


CREATE TABLE public.sweets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


ALTER TABLE public.sweets ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Anyone can view sweets"
  ON public.sweets FOR SELECT
  USING (true);


CREATE POLICY "Admins can insert sweets"
  ON public.sweets FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


CREATE POLICY "Admins can update sweets"
  ON public.sweets FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));


CREATE POLICY "Admins can delete sweets"
  ON public.sweets FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));


CREATE TABLE public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sweet_id UUID NOT NULL REFERENCES public.sweets(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;


CREATE POLICY "Users can view own purchases"
  ON public.purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON public.purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases"
  ON public.purchases FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;


CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_sweets_updated_at
  BEFORE UPDATE ON public.sweets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();


INSERT INTO public.sweets (name, category, price, quantity, description, image_url) VALUES
  ('Chocolate Truffles', 'Chocolate', 12.99, 50, 'Rich dark chocolate truffles with a smooth ganache center', '/placeholder.svg'),
  ('Strawberry Gummies', 'Gummy', 5.99, 100, 'Soft and chewy strawberry-flavored gummy candies', '/placeholder.svg'),
  ('Mint Chocolate Bar', 'Chocolate', 3.99, 75, 'Refreshing mint chocolate bar with crispy bits', '/placeholder.svg'),
  ('Sour Rainbow Strips', 'Sour', 4.99, 80, 'Tangy rainbow-colored sour candy strips', '/placeholder.svg'),
  ('Caramel Fudge', 'Caramel', 8.99, 40, 'Smooth and creamy homemade caramel fudge', '/placeholder.svg'),
  ('Lemon Drops', 'Hard Candy', 3.49, 120, 'Classic lemon-flavored hard candy drops', '/placeholder.svg');
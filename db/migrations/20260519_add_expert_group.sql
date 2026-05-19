ALTER TABLE public.experts
ADD COLUMN IF NOT EXISTS expert_group text DEFAULT 'home';

UPDATE public.experts
SET expert_group = 'home'
WHERE expert_group IS NULL;

CREATE INDEX IF NOT EXISTS idx_experts_expert_group
ON public.experts (expert_group);

export const galleryImages = [
  {
    src: "/medical-conference.png",
    alt: "Medical conference",
  },
  {
    src: "/professional-woman-doctor.png",
    alt: "Healthcare professional",
  },
  {
    src: "/professional-woman-executive.png",
    alt: "Healthcare executive",
  },
  {
    src: "/digital-health-workshop.png",
    alt: "Digital health workshop",
  },
  {
    src: "/healthcare-quality-workshop.png",
    alt: "Healthcare quality workshop",
  },
  {
    src: "/patient-experience-workshop.png",
    alt: "Patient experience workshop",
  },
]

export const comparisonData = [
  {
    category: "Patient Satisfaction",
    values: [
      { label: "Before Implementation", value: 65, color: "#94a3b8" },
      { label: "After Implementation", value: 92, color: "#3b82f6" },
    ],
  },
  {
    category: "Provider Efficiency",
    values: [
      { label: "Before Implementation", value: 70, color: "#94a3b8" },
      { label: "After Implementation", value: 88, color: "#3b82f6" },
    ],
  },
  {
    category: "Cost Reduction",
    values: [
      { label: "Before Implementation", value: 100, color: "#94a3b8" },
      { label: "After Implementation", value: 75, color: "#3b82f6" },
    ],
  },
  {
    category: "Clinical Outcomes",
    values: [
      { label: "Before Implementation", value: 72, color: "#94a3b8" },
      { label: "After Implementation", value: 95, color: "#3b82f6" },
    ],
  },
]

export const statData = [
  { label: "Patient Satisfaction", value: 92, color: "#3b82f6", suffix: "%" },
  { label: "Provider Efficiency", value: 88, color: "#3B82F6", suffix: "%" },
  { label: "Cost Reduction", value: 25, color: "#3B82F6", suffix: "%" },
  { label: "Clinical Outcomes", value: 95, color: "#3B82F6", suffix: "%" },
]

export const progressData = [
  { label: "EMR Adoption", value: 85, color: "#3b82f6" },
  { label: "Digital Transformation", value: 72, color: "#3B82F6" },
  { label: "Patient Engagement", value: 90, color: "#3B82F6" },
  { label: "Data Analytics", value: 68, color: "#3B82F6" },
]

export const tabContent = [
  {
    id: "services",
    label: "Services",
    content: `
      <h3 class="text-2xl font-semibold mb-4">Our Services</h3>
      <p class="mb-4">We offer comprehensive healthcare consulting services including:</p>
      <ul class="list-disc pl-6 space-y-2">
        <li>Strategic planning and implementation</li>
        <li>Digital transformation consulting</li>
        <li>Clinical workflow optimization</li>
        <li>Revenue cycle management</li>
        <li>Regulatory compliance guidance</li>
      </ul>
    `,
  },
  {
    id: "approach",
    label: "Our Approach",
    content: `
      <h3 class="text-2xl font-semibold mb-4">Our Approach</h3>
      <p class="mb-4">Our methodology is rooted in evidence-based practices and tailored to each organization's unique needs.</p>
      <p class="mb-4">We focus on:</p>
      <ul class="list-disc pl-6 space-y-2">
        <li>Data-driven decision making</li>
        <li>Stakeholder engagement at all levels</li>
        <li>Sustainable change management</li>
        <li>Measurable outcomes and ROI</li>
      </ul>
    `,
  },
  {
    id: "results",
    label: "Results",
    content: `
      <h3 class="text-2xl font-semibold mb-4">Proven Results</h3>
      <p class="mb-4">Our clients consistently achieve:</p>
      <ul class="list-disc pl-6 space-y-2">
        <li>30% average increase in operational efficiency</li>
        <li>25% reduction in operational costs</li>
        <li>95% patient satisfaction scores</li>
        <li>40% improvement in clinical outcomes</li>
      </ul>
    `,
  },
]

export const flipCardData = [
  {
    front: {
      title: "Strategic Planning",
      description: "Transform your healthcare organization with data-driven strategies",
      icon: "BarChart3",
    },
    back: {
      title: "Our Process",
      description: "We analyze your current state, identify opportunities, and develop actionable roadmaps for sustainable growth.",
      stats: ["100+ Plans Developed", "95% Success Rate", "30% ROI Average"],
    },
  },
  {
    front: {
      title: "Digital Health",
      description: "Leverage technology to improve patient care and operational efficiency",
      icon: "Monitor",
    },
    back: {
      title: "Solutions",
      description: "From EMR optimization to telehealth implementation, we guide your digital transformation journey.",
      stats: ["50+ Implementations", "85% Adoption Rate", "40% Time Saved"],
    },
  },
  {
    front: {
      title: "Clinical Excellence",
      description: "Enhance quality of care through evidence-based practices",
      icon: "Building2",
    },
    back: {
      title: "Outcomes",
      description: "Our clinical optimization programs improve patient outcomes while reducing costs.",
      stats: ["35% Quality Improvement", "20% Cost Reduction", "98% Satisfaction"],
    },
  },
]
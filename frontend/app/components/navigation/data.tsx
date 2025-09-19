import {
  Newspaper,
  Briefcase,
  Users,
  FlaskRoundIcon as Flask,
  Laptop,
  Phone,
  Handshake,
} from "lucide-react"
import { NavItem } from "./types"

export const navItems: NavItem[] = [
  {
    name: "About",
    href: "/about",
    icon: <Users className="w-5 h-5" />,
    description: "Learn about our mission, team, and values",
    featured: {
      title: "Our Leadership Team",
      description: "Meet the experts behind HM Healthcare Partners",
      href: "/about#leadership",
      image: "/healthcare-executive-portrait.png",
    },
  },
  {
    name: "Platforms",
    href: "/platforms",
    icon: <Laptop className="w-5 h-5" />,
    description: "Explore our innovative healthcare technology solutions",
    submenu: [
      {
        name: "IntelliC",
        href: "/platforms/intellic",
        description: "AI-powered clinical decision support",
        image: "/intellic-platform-dashboard.png",
      },
      {
        name: "Precognitive Health",
        href: "/platforms/precognitive-health",
        description: "Predictive analytics for preventive care",
        image: "/precognitive-health-dashboard.png",
      },
      {
        name: "Wear API",
        href: "/platforms/wear-api",
        description: "Wearable device integration platform",
        image: "/wearapi-dashboard.png",
      },
      {
        name: "Peregrine Medical Press",
        href: "/platforms/peregrine-medical-press",
        description: "Digital publishing for medical research",
        image: "/peregrine-device-mockup.png",
      },
    ],
    featured: {
      title: "Platform Innovation",
      description: "How our technologies are transforming healthcare delivery",
      href: "/platforms#innovation",
      image: "/healthcare-tech-partnership.png",
    },
  },
  {
    name: "Partners",
    href: "/partners",
    icon: <Handshake className="w-5 h-5" />,
    description: "Our strategic technology partners driving clinical research innovation",
    featured: {
      title: "Technology Ecosystem",
      description: "Comprehensive platform partners enabling advanced clinical trials",
      href: "/partners#partners",
      image: "/healthcare-tech-partnership.png",
    },
  },
  {
    name: "Research",
    href: "/research",
    icon: <Flask className="w-5 h-5" />,
    description: "Discover our latest research and clinical studies",
    submenu: [
      {
        name: "Clinical Studies",
        href: "/research/clinical-studies",
        description: "Ongoing and completed clinical trials",
        image: "/healthcare-research-director.png",
      },
      {
        name: "Publications",
        href: "/research/publications",
        description: "Peer-reviewed research publications",
        image: "/healthcare-partnership-meeting.png",
      },
      {
        name: "QA/QI",
        href: "/research/qa-qi",
        description: "Quality assurance and improvement",
        image: "/healthcare-quality-workshop.png",
      },
    ],
    featured: {
      title: "Research Spotlight",
      description: "Our latest breakthrough in healthcare analytics",
      href: "/research#spotlight",
      image: "/healthcare-data-exchange.png",
    },
  },
  {
    name: "Services",
    href: "/services",
    icon: <Briefcase className="w-5 h-5" />,
    description: "Professional healthcare consulting and implementation services",
  },
  {
    name: "Blog",
    href: "/blog",
    icon: <Newspaper className="w-5 h-5" />,
    description: "Insights and updates from our healthcare experts",
  },
  {
    name: "Contact",
    href: "/contact",
    icon: <Phone className="w-5 h-5" />,
    description: "Get in touch with our team",
  },
]
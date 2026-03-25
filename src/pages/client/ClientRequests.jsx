import { useState } from "react";

const ClientRequests = () => {
  const [projectRequests] = useState([
    // Non-Negotiable Requests
    {
      id: 1,
      title: "E-Commerce Platform Development",
      budget: "$5,000 - $8,000",
      deadline: "2 months",
      negotiable: false,
      description: "Build a complete e-commerce platform with payment integration",
      requirements: ["React", "Node.js", "MongoDB", "Stripe integration"],
      skills: ["Frontend", "Backend", "Database Design"],
      category: "Web Development"
    },
    {
      id: 2,
      title: "Mobile App Redesign",
      budget: "$3,000 - $4,500",
      deadline: "6 weeks",
      negotiable: false,
      description: "Complete redesign of existing mobile app UI/UX",
      requirements: ["Figma", "React Native", "iOS", "Android"],
      skills: ["UI/UX Design", "Mobile Development"],
      category: "Mobile App"
    },
    {
      id: 3,
      title: "API Development & Documentation",
      budget: "$2,500 - $3,500",
      deadline: "3 weeks",
      negotiable: false,
      description: "Create RESTful API with comprehensive documentation",
      requirements: ["Node.js", "Express", "PostgreSQL", "OpenAPI/Swagger"],
      skills: ["Backend Development", "API Design"],
      category: "Backend"
    },
    // Negotiable Requests
    {
      id: 4,
      title: "Social Media Analytics Dashboard",
      budget: "$2,000 - $5,000",
      deadline: "Flexible",
      negotiable: true,
      description: "Interactive dashboard for tracking social media metrics with charts and graphs",
      requirements: ["React", "Chart.js/D3.js", "REST API integration"],
      skills: ["Frontend", "Data Visualization"],
      category: "Web Development"
    },
    {
      id: 5,
      title: "Logo Design & Branding Package",
      budget: "$800 - $2,500",
      deadline: "Negotiable",
      negotiable: true,
      description: "Complete branding package including logo, color palette, and guidelines",
      requirements: ["Adobe Creative Suite", "Design portfolio"],
      skills: ["Graphic Design", "Branding"],
      category: "Design"
    },
    {
      id: 6,
      title: "WordPress Plugin Development",
      budget: "$1,500 - $4,000",
      deadline: "4-8 weeks",
      negotiable: true,
      description: "Custom WordPress plugin for advanced filtering and content management",
      requirements: ["PHP", "WordPress", "JavaScript"],
      skills: ["WordPress Development", "Plugin Development"],
      category: "Web Development"
    },
    {
      id: 7,
      title: "SEO Optimization & Strategy",
      budget: "$1,200 - $3,000",
      deadline: "Ongoing (Monthly)",
      negotiable: true,
      description: "Website SEO audit and implementation of optimization strategy",
      requirements: ["SEO tools", "Content optimization", "Technical SEO"],
      skills: ["SEO", "Content Marketing"],
      category: "Digital Marketing"
    },
    {
      id: 8,
      title: "Cloud Migration & DevOps Setup",
      budget: "$3,000 - $6,000",
      deadline: "6-8 weeks",
      negotiable: true,
      description: "Migrate existing application to cloud and set up CI/CD pipeline",
      requirements: ["AWS/Google Cloud", "Docker", "Kubernetes", "CI/CD"],
      skills: ["DevOps", "Cloud Infrastructure"],
      category: "Infrastructure"
    }
  ]);

  const nonNegotiableRequests = projectRequests.filter(r => !r.negotiable);
  const negotiableRequests = projectRequests.filter(r => r.negotiable);

  const RequestCard = ({ request }) => (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{request.title}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
          request.negotiable 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {request.negotiable ? 'NEGOTIABLE' : 'NON-NEGOTIABLE'}
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-4">{request.description}</p>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Budget</p>
          <p className="text-lg font-bold text-green-600">{request.budget}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Deadline</p>
          <p className="text-lg font-bold text-purple-600">{request.deadline}</p>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Category</p>
        <span className="inline-block px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm">
          {request.category}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Skills Required</p>
        <div className="flex flex-wrap gap-2">
          {request.skills.map((skill, idx) => (
            <span key={idx} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Technologies</p>
        <div className="flex flex-wrap gap-2">
          {request.requirements.map((req, idx) => (
            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {req}
            </span>
          ))}
        </div>
      </div>

      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">
        View Details
      </button>
    </div>
  );

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Non-Negotiable Section */}
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="h-1 w-1 rounded-full bg-red-600 mr-3"></div>
            <h2 className="text-3xl font-bold text-gray-800">Non-Negotiable Requests</h2>
            <span className="ml-4 px-4 py-1 bg-red-50 text-red-700 rounded-full text-sm font-semibold">
              {nonNegotiableRequests.length} Projects
            </span>
          </div>
          <p className="text-gray-600 mb-6">These project requirements are fixed and non-negotiable. All specifications must be met as stated.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nonNegotiableRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>

        {/* Negotiable Section */}
        <div>
          <div className="flex items-center mb-6">
            <div className="h-1 w-1 rounded-full bg-blue-600 mr-3"></div>
            <h2 className="text-3xl font-bold text-gray-800">Negotiable Requests</h2>
            <span className="ml-4 px-4 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
              {negotiableRequests.length} Projects
            </span>
          </div>
          <p className="text-gray-600 mb-6">These projects have flexible terms. Budget, timeline, and some requirements can be negotiated with the right candidate.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {negotiableRequests.map(request => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientRequests;

import { useLocation, Link, useParams } from "react-router";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Fragment, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { fetchProjectById } from "@/features/projectSlice";
import { fetchTaskById } from "@/features/taskSlice";

const labelMap: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Settings",
  projects: "Projects",
  create: "Create",
  edit: "Edit",
  tasks: "Tasks",
  unauthorized: "Unauthorized",
  login: "Login",
  register: "Register",
};

export default function Breadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const dispatch = useAppDispatch();

  const currentProject = useAppSelector(
    (state) => state.projects.currentProject
  );
  const currentTask = useAppSelector(
    (state) => state.tasks.currentTask
  );

  const segments = location.pathname.split("/").filter(Boolean);

  useEffect(() => {
    if (params.id) {
      if (segments.includes("projects")) {
        if (!currentProject || currentProject.id !== params.id) {
          dispatch(fetchProjectById(params.id));
        }
      } else if (segments.includes("tasks")) {
        if (!currentTask || currentTask.id !== params.id) {
          dispatch(fetchTaskById(params.id));
        }
      }
    }
  }, [params.id, segments, dispatch, currentProject, currentTask]);

  const getSegmentLabel = (segment: string): string => {
    if (params.id && segment === params.id) {
      if (segments.includes("projects") && currentProject) {
        return currentProject.title;
      }
      if (segments.includes("tasks") && currentTask) {
        return currentTask.title;
      }
      return segment;
    }

    if (labelMap[segment]) {
      return labelMap[segment];
    }

    return decodeURIComponent(segment)
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const shouldShowBreadcrumbs = (): boolean => {
    const authPages = ["/login", "/register"];
    return !authPages.includes(location.pathname);
  };

  const getBreadcrumbHref = (index: number): string => {
    return "/" + segments.slice(0, index + 1).join("/");
  };

  const breadcrumbs = segments.map((segment, index) => {
    const href = getBreadcrumbHref( index);
    const isLast = index === segments.length - 1;
    const label = getSegmentLabel(segment);

    return (
      <Fragment key={href}>
        <BreadcrumbItem className="text-black dark:text-white">
          {!isLast ? (
            <BreadcrumbLink asChild>
              <Link to={href}>{label}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        {!isLast && <BreadcrumbSeparator className="text-black dark:text-white" />}
      </Fragment>
    );
  });

  if (!shouldShowBreadcrumbs()) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="text-black dark:text-white">
          <BreadcrumbLink asChild>
            <Link to="/">Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {segments.length > 0 && <BreadcrumbSeparator className="text-black dark:text-white" />}
        {breadcrumbs}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

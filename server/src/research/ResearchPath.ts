import { Technology } from "./Technology";

/**
 * The techs to research, in order, to reach one that isn't available yet - what Civ 5 queues when the
 * player clicks a tech deep in the tree.
 */
export class ResearchPath {
  /** Every unresearched tech on the way to `techName`, prerequisites first and the tech itself last. */
  public static to(techName: string, isResearched: (techName: string) => boolean): string[] {
    const path: string[] = [];
    ResearchPath.visit(techName, isResearched, path);
    return path;
  }

  // Depth first, so each tech lands after all of its own prerequisites.
  private static visit(techName: string, isResearched: (techName: string) => boolean, path: string[]) {
    if (isResearched(techName) || path.includes(techName)) return;

    const tech = Technology.createFromName(techName);
    if (!tech) return;

    tech.getPrerequisites().forEach((prereq) => ResearchPath.visit(prereq, isResearched, path));
    path.push(tech.getName());
  }
}

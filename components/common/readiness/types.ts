export interface ReadinessSection {
  id: string;
  name: string;
  progress: number;
}

export interface ReadinessData {
  title: string;
  overall: number;
  sections: ReadinessSection[];
}
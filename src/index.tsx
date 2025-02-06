import React, { useState, useEffect, createContext, useContext } from "react";
import ReactDOM from "react-dom/client";

interface Joke {
  categories: string[];
  created_at: string;
  icon_url: string;
  id: string;
  updated_at: string;
  url: string;
  value: string;
}

interface JokeItemProps {
  jokeId: string;
}

interface JokesContextType {
  jokes: Joke[];
  getJokeById: (id: string) => Joke;
  filterJokes: (value: string) => void;
}

const tableConfig = [
  {
    key: "icon_url",
    label: "Icon",
    renderer: (src) => <img src={src} alt="icon" />,
  },
  { key: "value", label: "Text" },
  {
    key: "created_at",
    renderer: (dateStr: string) => new Date(dateStr).toDateString(),
    label: "Created date",
  },
  {
    key: "updated_at",
    renderer: (dateStr: string) => new Date(dateStr).toDateString(),
    label: "Updated date",
  },
  {
    key: "url",
    label: "Url",
    renderer: (url) => (
      <a href={url} target="_blank" rel="noreferrer">
        Link
      </a>
    ),
  },
  {
    key: "categories",
    renderer: (elements: string[]) => (
      <div style={{ display: "flex", flexDirection: "row" }}>
        {elements.map((el, index) => (
          <span key={index}>{el}</span>
        ))}
      </div>
    ),
  },
];

const fetchJoke = async (): Promise<Joke> => {
  const request = await fetch("https://api.chucknorris.io/jokes/random");
  return await request.json();
};

const fetchJokes = async (count: number = 3): Promise<Joke[]> => {
  const promises = Array.from({ length: count }, fetchJoke);
  const jokes = await Promise.all(promises);
  return jokes;
};

const JokesContext = createContext<JokesContextType | undefined>({
  jokes: [],
  getJokeById: () => {},
  filterJokes: () => {},
});

export const JokesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [jokes, setJokes] = useState<Joke[]>([]);
  const [filteredJokes, setFilteredJokes] = useState<Joke[]>([]);

  const fetchNewJokes = async (count: number) => {
    const newJokes = await fetchJokes(count);
    console.log(newJokes, "newJokes");
    setJokes(newJokes);
    setFilteredJokes(newJokes);
  };

  const getJokeById = async (id: string) => {
    return jokes.find((joke) => joke?.id === id);
  };

  useEffect(() => {
    fetchNewJokes(3);
  }, []);

  const filterJokes = (value) => {
    if (!value) {
      setFilteredJokes(jokes);
    } else {
      setFilteredJokes(
        jokes.filter((joke) =>
          joke?.value?.toLowerCase()?.includes(value?.toLowerCase())
        )
      );
    }
  };

  return (
    <JokesContext.Provider
      value={{ jokes: filteredJokes, getJokeById, filterJokes }}
    >
      {children}
    </JokesContext.Provider>
  );
};

export const useJokes = () => {
  const context = useContext(JokesContext);
  if (!context) {
    throw new Error("useJokes must be used within a JokesProvider");
  }
  return context;
};

const JokeItem: React.FC<JokeItemProps> = ({ jokeId }) => {
  const { jokes } = useJokes();
  const joke = jokes.find((j) => j.id === jokeId);

  if (!joke) return null;

  return (
    <tr>
      {tableConfig.map((configItem) => {
        const jokeValue = joke[configItem.key];
        const renderer = configItem.renderer
          ? configItem.renderer(jokeValue)
          : jokeValue;
        return (
          <td
            style={{ border: "1px solid black", padding: "8px" }}
            key={configItem.key}
          >
            {renderer}
          </td>
        );
      })}
    </tr>
  );
};

const JokesTable = () => {
  const { jokes } = useContext(JokesContext);

  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          {tableConfig.map((el, index) => (
            <th key={index}>{el.label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {jokes.map((joke) => (
          <JokeItem key={joke.id} jokeId={joke.id} />
        ))}
      </tbody>
    </table>
  );
};

const Filter = () => {
  const { filterJokes } = useContext(JokesContext);
  const [filter, setFilter] = useState("");

  const handleFilterChange = (e) => {
    const searchText = e.target.value;
    setFilter(searchText);
    filterJokes(searchText);
  };

  return (
    <input
      type="text"
      placeholder="Filter jokes..."
      value={filter}
      onChange={handleFilterChange}
      style={{ padding: "5px", marginBottom: "10px", width: "100%" }}
    />
  );
};

const App = () => {
  return (
    <JokesProvider>
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h2>Jokes</h2>
        <Filter />
        <JokesTable />
      </div>
    </JokesProvider>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

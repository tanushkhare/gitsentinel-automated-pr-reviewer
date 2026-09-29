import axios from 'axios';

export const fetchPrDiff = async (diffUrl: string): Promise<string> => {
  try {
    const response = await axios.get(diffUrl, {
      headers: {
        Accept: 'application/vnd.github.v3.diff',
        // Optional: Add GITHUB_TOKEN if hitting rate limits
        ...(process.env.GITHUB_TOKEN && { Authorization: `token ${process.env.GITHUB_TOKEN}` }),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching PR diff from GitHub:', error);
    throw new Error('Failed to retrieve pull request diff');
  }
};
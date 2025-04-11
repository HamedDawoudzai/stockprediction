// pages/chart.js
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

export default function ChartPage() {
  const router = useRouter();
  const { symbol } = router.query;

  // activeTab can be 'past', 'future', or 'table'
  const [activeTab, setActiveTab] = useState('past');
  // selectedRange for historical data: "all", "week", "month", "3months", "year", "5years"
  const [selectedRange, setSelectedRange] = useState("all");
  // selectedRange for future data: "week", "month", "3months", "year", "5years"
  const [selectedFutureRange, setSelectedFutureRange] = useState("week");
  const [chartData, setChartData] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fixed dates for historical portion:
  const defaultStartStr = "2013-02-08";
  // Our SP500 file ends at this date by default.
  const defaultEndStr   = "2018-02-07";

  // Helper: Generate an array of Date objects (daily) for a given range.
  const generateDailyDateRange = (start, end) => {
    const dateArray = [];
    let currentDate = new Date(start);
    const lastDate = new Date(end);
    while (currentDate <= lastDate) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dateArray;
  };

  // Helper: Compute visible range based on overallEnd and selected historical range.
  // "all" uses defaultStartStr; otherwise subtract the appropriate amount from overallEnd.
  const computeRangeDates = (overallEnd, range) => {
    let rangeEnd = new Date(overallEnd);
    let rangeStart;
    if (range === "all") {
      rangeStart = new Date(defaultStartStr);
    } else {
      rangeStart = new Date(rangeEnd);
      switch(range) {
        case "week":
          rangeStart.setDate(rangeEnd.getDate() - 7);
          break;
        case "month":
          rangeStart.setMonth(rangeEnd.getMonth() - 1);
          break;
        case "3months":
          rangeStart.setMonth(rangeEnd.getMonth() - 3);
          break;
        case "year":
          rangeStart.setFullYear(rangeEnd.getFullYear() - 1);
          break;
        case "5years":
          rangeStart.setFullYear(rangeEnd.getFullYear() - 5);
          break;
        default:
          rangeStart = new Date(defaultStartStr);
      }
      const fixedStart = new Date(defaultStartStr);
      if (rangeStart < fixedStart) {
        rangeStart = fixedStart;
      }
    }
    return { start: rangeStart, end: rangeEnd };
  };

  // Helper: Forward-fill missing data so that if a day has no data, it reuses the previous value.
  const fillGaps = (prices) => {
    let lastValue = null;
    return prices.map(val => {
      if (val !== null && val !== undefined) {
        lastValue = val;
        return val;
      } else {
        return lastValue;
      }
    });
  };

  // Fetch unified (historical + current) price data for the Past tab.
  // We query from defaultStartStr until today's date.
  const fetchPastData = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchStart = defaultStartStr;
      const fetchEnd = new Date().toISOString().split("T")[0]; // today's date
      const res = await fetch(
        `/api/unified_prices?symbol=${encodeURIComponent(symbol)}&start_date=${fetchStart}&end_date=${fetchEnd}`
      );
      if (res.ok) {
        const data = await res.json();
        // Build a lookup map: date (YYYY-MM-DD) -> close price.
        const dataMap = {};
        let maxDataDate = new Date(defaultEndStr);
        data.forEach(item => {
          dataMap[item.date] = Number(item.close);
          const d = new Date(item.date);
          if (d > maxDataDate) {
            maxDataDate = d;
          }
        });
        // overallEnd is the later of defaultEndStr and the latest data date.
        const overallEnd = maxDataDate;
        const { start: rangeStart, end: rangeEnd } = computeRangeDates(overallEnd, selectedRange);
        const dateRange = generateDailyDateRange(rangeStart, rangeEnd);
        const labels = dateRange.map(date => date.toLocaleDateString());
        let prices = dateRange.map(date => {
          const dateKey = date.toISOString().split("T")[0];
          return dataMap.hasOwnProperty(dateKey) ? dataMap[dateKey] : null;
        });
        prices = fillGaps(prices);

        setChartData({
          labels,
          datasets: [
            {
              label: `${symbol} Close Price (Past)`,
              data: prices,
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 0,
              borderWidth: 2,
              tension: 0,
              spanGaps: true,
            },
          ],
        });
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch historical data.');
      }
    } catch (err) {
      console.error('Error fetching historical data:', err);
      setError('An unexpected error occurred.');
    }
    setLoading(false);
  };

  // Mapping from future range selection to number of days to predict.
  const futureRangeMapping = {
    week: 7,
    month: 30,
    "3months": 90,
    year: 365,
    "5years": 1825,
  };

  // Fetch future predicted data.
  // We first fetch the unified prices to get the anchor (last historical record)
  // and then call /api/predict_price with the selected future_range.
  const fetchFutureData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch unified prices to obtain the last historical record.
      const unifiedRes = await fetch(
        `/api/unified_prices?symbol=${encodeURIComponent(symbol)}`
      );
      let anchorPoint = null;
      if (unifiedRes.ok) {
        const unifiedData = await unifiedRes.json();
        if (unifiedData.length > 0) {
          anchorPoint = unifiedData[unifiedData.length - 1]; // the last record
        }
      }
      // Determine how many days to predict.
      const daysToFetch = futureRangeMapping[selectedFutureRange] || 10;
      // Call the predict_price endpoint with the future_range parameter.
      const predictRes = await fetch(
        `/api/predict_price?symbol=${encodeURIComponent(symbol)}&days=${daysToFetch}&future_range=${selectedFutureRange}`
      );
      if (predictRes.ok) {
        const predictionData = await predictRes.json();
        // Prepend the anchor point to ensure the graph starts at the last historical data point.
        let combinedData = [];
        if (anchorPoint) {
          combinedData = [{
            date: anchorPoint.date,  // The anchor date from historical data
            predicted_close: Number(anchorPoint.close)
          }, ...predictionData];
        } else {
          combinedData = predictionData;
        }
        const labels = combinedData.map(item => item.date);
        const prices = combinedData.map(item => Number(item.predicted_close));
        setChartData({
          labels,
          datasets: [
            {
              label: `${symbol} Predicted Close Price (Future)`,
              data: prices,
              borderColor: 'rgba(153, 102, 255, 1)',
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              fill: false,
              pointRadius: 0,
              pointHoverRadius: 0,
              borderWidth: 2,
              tension: 0,
              spanGaps: true,
            },
          ],
        });
      } else {
        const errData = await predictRes.json();
        setError(errData.error || 'Failed to fetch prediction data.');
      }
    } catch (err) {
      console.error('Error fetching future data:', err);
      setError('An unexpected error occurred.');
    }
    setLoading(false);
  };

  // Fetch unified price data for the Table tab.
  const fetchTableData = async () => {
    setLoading(true);
    setError('');
    try {
      const fetchStart = defaultStartStr;
      const fetchEnd = new Date().toISOString().split("T")[0];
      const res = await fetch(
        `/api/unified_prices?symbol=${encodeURIComponent(symbol)}&start_date=${fetchStart}&end_date=${fetchEnd}`
      );
      if (res.ok) {
        const data = await res.json();
        setTableData(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'Failed to fetch unified price data.');
      }
    } catch (err) {
      console.error('Error fetching unified price data:', err);
      setError('An unexpected error occurred.');
    }
    setLoading(false);
  };

  // Refresh data when symbol, activeTab, or the selected ranges change.
  useEffect(() => {
    if (!symbol) return;
    setChartData(null);
    setTableData([]);
    if (activeTab === 'past') {
      fetchPastData();
    } else if (activeTab === 'future') {
      fetchFutureData();
    } else if (activeTab === 'table') {
      fetchTableData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, activeTab, selectedRange, selectedFutureRange]);

  const handleGoBack = () => {
    router.back();
  };

  // Render range selection buttons for the Past tab.
  const renderPastRangeButtons = () => {
    const ranges = [
      { label: "All", value: "all" },
      { label: "Week", value: "week" },
      { label: "Month", value: "month" },
      { label: "3 Months", value: "3months" },
      { label: "Year", value: "year" },
      { label: "5 Years", value: "5years" },
    ];
    return (
      <div style={styles.rangeButtonContainer}>
        {ranges.map(range => (
          <button
            key={range.value}
            style={
              selectedRange === range.value 
              ? { ...styles.rangeButton, ...styles.activeRangeButton }
              : styles.rangeButton
            }
            onClick={() => setSelectedRange(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>
    );
  };

  // Render range selection buttons for the Future tab.
  const renderFutureRangeButtons = () => {
    const ranges = [
      { label: "Week", value: "week" },
      { label: "Month", value: "month" },
      { label: "3 Months", value: "3months" },
      { label: "Year", value: "year" },
      { label: "5 Years", value: "5years" },
    ];
    return (
      <div style={styles.rangeButtonContainer}>
        {ranges.map(range => (
          <button
            key={range.value}
            style={
              selectedFutureRange === range.value 
              ? { ...styles.rangeButton, ...styles.activeRangeButton }
              : styles.rangeButton
            }
            onClick={() => setSelectedFutureRange(range.value)}
          >
            {range.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={handleGoBack} style={styles.backButton}>Back</button>
        <h1 style={styles.title}>{symbol ? `${symbol} Chart` : 'Chart'}</h1>
      </header>

      <div style={styles.tabContainer}>
        <button
          style={activeTab === 'past' ? { ...styles.tabButton, ...styles.activeTab } : styles.tabButton}
          onClick={() => setActiveTab('past')}
        >
          Past
        </button>
        <button
          style={activeTab === 'future' ? { ...styles.tabButton, ...styles.activeTab } : styles.tabButton}
          onClick={() => setActiveTab('future')}
        >
          Future
        </button>
        <button
          style={activeTab === 'table' ? { ...styles.tabButton, ...styles.activeTab } : styles.tabButton}
          onClick={() => setActiveTab('table')}
        >
          Table
        </button>
      </div>

      {activeTab === 'past' && renderPastRangeButtons()}
      {activeTab === 'future' && renderFutureRangeButtons()}

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {loading ? (
        <p style={styles.loading}>Loading...</p>
      ) : activeTab === 'table' ? (
        tableData && tableData.length ? (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.tableHeader}>Symbol</th>
                  <th style={styles.tableHeader}>Close Price</th>
                  <th style={styles.tableHeader}>Date</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.tableCell}>{item.symbol}</td>
                    <td style={styles.tableCell}>{item.close}</td>
                    <td style={styles.tableCell}>{item.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={styles.noData}>No unified price data available.</p>
        )
      ) : chartData ? (
        <div style={styles.chartWrapper}>
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                x: {
                  ticks: {
                    autoSkip: true,
                    maxTicksLimit: 10,
                  },
                },
              },
            }}
          />
        </div>
      ) : (
        <p style={styles.noData}>No chart data available.</p>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#0b0b0b',
    color: '#fff',
    minHeight: '100vh',
    padding: '20px',
    fontFamily: 'sans-serif',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
  },
  backButton: {
    background: 'transparent',
    border: '1px solid #fff',
    color: '#fff',
    padding: '8px 16px',
    cursor: 'pointer',
    marginRight: '20px',
    borderRadius: '4px',
  },
  title: {
    margin: 0,
    fontSize: '1.5rem',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '2px solid #ccc',
    marginBottom: '20px',
  },
  tabButton: {
    flex: 1,
    padding: '10px',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    color: '#fff',
  },
  activeTab: {
    borderBottom: '4px solid #007BFF',
    fontWeight: 'bold',
  },
  rangeButtonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  rangeButton: {
    padding: '8px 12px',
    margin: '0 5px',
    backgroundColor: '#444',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  activeRangeButton: {
    backgroundColor: '#007BFF',
  },
  loading: {
    color: '#ccc',
    fontSize: '1rem',
  },
  chartWrapper: {
    backgroundColor: '#222',
    borderRadius: '8px',
    padding: '20px',
    minHeight: '400px',
  },
  noData: {
    color: '#ccc',
    fontSize: '1rem',
  },
  tableWrapper: {
    overflowX: 'auto',
    backgroundColor: '#222',
    borderRadius: '8px',
    padding: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    borderBottom: '2px solid #fff',
    textAlign: 'left',
    padding: '8px',
  },
  tableCell: {
    borderBottom: '1px solid #555',
    padding: '8px',
  },
};

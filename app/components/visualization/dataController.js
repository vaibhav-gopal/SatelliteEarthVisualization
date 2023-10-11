'use client'

export default function DataGUI({ loaded = false }) {
    return (
        <div class='w-full h-full'>
            {loaded ? <h1>Data Loaded</h1> : <h1>Loading Data</h1>}
        </div>
    )
}
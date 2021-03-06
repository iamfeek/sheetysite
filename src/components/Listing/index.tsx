import Fuse from 'fuse.js'
import { graphql, useStaticQuery } from 'gatsby'
import React, { useState } from 'react'
import { ItemData, ListingType, SiteData, Theme } from '../../utils/models'
import Events from './Events'
import ListingItems from './listing-items'

interface Props {
  theme: Theme
  siteData: SiteData
}

const Listing: React.FC<Props> = ({ theme, siteData }) => {
  const { allGoogleListingSheet } = useStaticQuery(graphql`
    query allGoogleListingSheetQuery {
      allGoogleListingSheet {
        nodes {
          id
          title
          actionUrl
          tags
          itemId
          subtitle
          description
          image
        }
      }
    }
  `)

  const getAllItems = () => {
    const allItems = allGoogleListingSheet.nodes
    const formattedItems = allItems.map((item) => {
      if (typeof item.tags === 'string') {
        item.tags = item.tags.split(', ')
      }
      return item
    })
    return formattedItems
  }

  const allItems = getAllItems()

  const getDistinctTags = () => {
    const distinctTags = []
    allItems.forEach((item) => {
      item.tags.forEach((tag) => {
        !distinctTags.includes(tag) && distinctTags.push(tag)
      })
    })
    return distinctTags
  }

  const distinctTags = getDistinctTags()
  const ALL = 'All'
  const tabs = [ALL, ...distinctTags]
  const [currentTab, setCurrentTab] = useState(tabs[0])
  const [searchTerm, setSearchTerm] = useState('')

  const getFuseSearchResult = (items: ItemData[], searchTerm: string): object[] => {
    const options = {
      isCaseSensitive: false,
      findAllMatches: false,
      includeMatches: false,
      includeScore: false,
      useExtendedSearch: false,
      minMatchCharLength: 1,
      shouldSort: true,
      threshold: 0.4,
      location: 0,
      distance: 100,
      keys: ['title', 'subtitle', 'description'],
    }

    const fuse: Fuse<any, Fuse.IFuseOptions<any>> = new Fuse(items, options)
    const fuseSearchResult = fuse.search(searchTerm)
    return fuseSearchResult.map((result) => result.item)
  }

  const getItemsToDisplay = () => {
    const itemsInTab = currentTab !== ALL ? allItems.filter((item) => item.tags.includes(currentTab)) : allItems
    const searchResult = searchTerm ? getFuseSearchResult(itemsInTab, searchTerm) : itemsInTab
    return searchResult
  }

  const itemsToDisplay = getItemsToDisplay()

  const { text, altBackground } = theme

  const handleTabClick = (tab) => {
    setCurrentTab(tab)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  const renderTabs = () => {
    if (distinctTags.length > 0) {
      return tabs.map((tag) => (
        <li className="mr-3" key={tag}>
          <a
            className={`inline-block rounded py-1 px-3 cursor-pointer ${
              tag === currentTab ? `${altBackground} ${text}` : `${text}`
            }`}
            onClick={() => handleTabClick(tag)}
          >
            {tag}
          </a>
        </li>
      ))
    }
    return <></>
  }

  const renderListing = () => {
    const { listingType } = siteData

    switch (listingType) {
      case ListingType.EVENTS:
        return <Events theme={theme} items={itemsToDisplay} siteData={siteData} />
      default:
        return <ListingItems theme={theme} items={itemsToDisplay} siteData={siteData} />
    }
  }

  return (
    <div className="container mx-auto mt-16 mb-32 px-4" id="main">
      <ul className="mt-4 flex justify-center">{renderTabs()}</ul>
      <input
        className={`focus:outline-none focus:shadow-lg border border-gray-300 shadow rounded-lg py-2 px-4 block mt-8 w-1/2 mx-auto`}
        type="text"
        placeholder="Search"
        onChange={(e) => handleSearch(e)}
      />
      {renderListing()}
    </div>
  )
}

export default Listing

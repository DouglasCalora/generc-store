import axios from 'axios'
import { get } from 'lodash'

export default class {
  constructor (globalCongif = {}) {
    const {
      api,
      paths
    } = globalCongif

    this.api = api
    this.paths = paths
  }

  /**
   * Function that handle path to object using the method "get" from lodash
   *
   * @param {object} result result of API success
   * @param {object} paths path to result
   * @param {boolean} [isError] isError result of catch
   * @return {[]|object|string|number} return the value of API
   *
   * @example
   * handlePath(apiResponse, {
   *  configPath: 'error.data',
   *  model: 'list'
   * }, true)
   */
  handlePath (result, paths, isError) {
    const { configPath, path, model } = paths

    if (!configPath && !path && !this.paths[model]) {
      return isError ? result.data : result.response.data
    }

    return get(result, path || configPath || !this.paths[model])
  }

  // generateStore (config = []) {
  //   const from = {
  //     fetchList: ['list']
  //   }
  // },

  createModule (entity, config = {}) {
    const self = this
    const identifier = config.identifier || 'id'

    return {
      namespaced: config.namespaced || true,

      state: {
        list: [],
        single: {},
        errors: {
          fetchList: null,
          fetchSingle: null,
          update: null,
          create: null,
          delete: null
        }
      },

      getters: {
        list: ({ list }) => list,

        single: ({ list }) => id => list.find(item => item[identifier] === id),

        errors: ({ errors }) => errors
      },

      mutations: {
        setList (state, list) {
          state.list = list
        },

        setSingle (state, single) {
          state.single = single
        },

        updateList (state, { payload, id }) {
          const index = state.list.findIndex(item => item[identifier] === id)

          if (~index) {
            return state.list.splice(index, 1, payload)
          }

          state.errors.update = true
        },

        setErrors (state, { model, error, clear }) {
          state.errors[model] = clear && state.errors[model] ? null : error
        }
      },

      actions: {
        /**
         * function that fetch the methods "get" and returns a list (array),
         * and populate the state "list"
         *
         * @param {object} commit call the mutation setList and setErrors
         * @param {object} configs get all configs
         * @return {Promise} return the promise of API (can be success or error)
         *
         * @example
         * fetchList({
         *  params: { search: 'title', offset: 12 },
         *  url: '/users/list',
         *  errorPath: 'data.results',
         *  listPath: 'data.results.'
         * }).then(response => console.log('Hi it worked! :)')).catch(error => {
         *  console.log('Sorry it does not worked :(')
         * })
         */
        fetchList ({ commit }, { params, url, errorPath, path } = {}) {
          const model = 'fetchList'

          url = url || config.fetchListURL || `/${entity}`

          return axios.get(url, params).then(response => {
            commit('setErrors', { model, clear: true })

            return commit('setList', self.handlePath(
              response,
              {
                configPath: config.path,
                path,
                model: 'list'
              }
            )) && response
          }).catch(error => {
            return Promise.reject(error) && commit('setErrors', {
              model,
              error: self.handlePath(
                error,
                {
                  configPath: config.path,
                  path: errorPath,
                  model: 'listError'
                }, true
              )
            })
          })
        },

        /**
         * funtion the fetch method "get" with id (or without) and returns an object
         * and populate the state "single"
         *
         * @param {object} commit call the mutation setSingle and setErrors
         * @param {object} configs get all configs
         * @return {Promise} return the promise of API (can be success or error)
         *
         * @example
         * fetchSingle({
         *  params: { search: 'name' },
         *  url: 'user/list',
         *  errorPath: 'data.results',
         *  path: 'data.results.'
         * }).then(response => console.log('Hi it worked! :)')).catch(error => {
         *  console.log('Sorry it does not worked :(')
         * })
         */
        fetchSingle ({ commit }, { params, url, id, errorPath, path } = {}) {
          const model = 'fetchSingle'

          url = url || config.fetchListURL || id ? `/${entity}/id` : `/${entity}`

          return axios.get(url, params).then(response => {
            commit('setErrors', { model, clear: true })

            return commit('setSingle', self.handlePath(
              response,
              {
                configPath: config.path,
                path,
                model: 'single'
              }
            )) && response
          }).catch(error => {
            return Promise.reject(error) && commit('setErrors', {
              model,
              error: self.handlePath(
                error,
                {
                  configPath: config.path,
                  path: errorPath,
                  model: 'singleError'
                }, true
              )
            })
          })
        },

        update ({ commit }, { payload, url, id, path, errorPath }) {
          const model = 'update'

          url = url || config.fetchListURL || id ? `/${entity}/id` : `/${entity}`

          return axios.put(url, payload).then(response => {
            commit('setErrors', { model, clear: true })

            return commit('updateList', { payload: response, id })
          }).catch(error => {
            return Promise.reject(error)
          })
        }
      }
    }
  }
}

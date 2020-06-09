import React from 'react'

import Graph from 'vis-react'

import Select from 'react-select'

import Card from '@material-ui/core/Card'
import CardContent from '@material-ui/core/CardContent'

import Dialog from '@material-ui/core/Dialog'
import DialogActions from '@material-ui/core/DialogActions'
import DialogContent from '@material-ui/core/DialogContent'
import DialogContentText from '@material-ui/core/DialogContentText'
import DialogTitle from '@material-ui/core/DialogTitle'

import Table from '@material-ui/core/Table'
import TableBody from '@material-ui/core/TableBody'
import TableCell from '@material-ui/core/TableCell'
import TableContainer from '@material-ui/core/TableContainer'
import TableHead from '@material-ui/core/TableHead'
import TableRow from '@material-ui/core/TableRow'

import Grid from '@material-ui/core/Grid'

import { Checkbox } from '@material-ui/core'
import FormGroup from '@material-ui/core/FormGroup'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import TextField from '@material-ui/core/TextField'
import { withStyles } from '@material-ui/styles'

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Button from '@material-ui/core/Button'

import {
  sqrt,
  matrix,
  fraction,
  format,
  zeros,
  index,
  subset,
  multiply,
  transpose,
  round,
  ones,
  add
} from 'mathjs'

const styles = theme => ({ root: { overflow: 'visible' } })

class Home extends React.Component {
  Home() { }

  state = {
    nodes: [
      { id: 'P1', label: 'P1' },
      { id: 'P2', label: 'P2' },
      { id: 'P3', label: 'P3' },
      { id: 'P4', label: 'P4' },
      { id: 'P5', label: 'P5' }
    ],
    edges: [
      { from: 'P1', to: 'P2' },
      { from: 'P2', to: 'P1' },
      { from: 'P2', to: 'P5' },
      { from: 'P3', to: 'P2' },
      { from: 'P4', to: 'P2' },
      { from: 'P4', to: 'P5' },
      { from: 'P5', to: 'P3' }
    ],

    selects: {
      nodes: [
        { value: 'P1', label: 'P1' },
        { value: 'P2', label: 'P2' },
        { value: 'P3', label: 'P3' },
        { value: 'P4', label: 'P4' },
        { value: 'P5', label: 'P5' }
      ],
      edges: [
        { value: 'P1 P2', label: 'P1 -> P2' },
        { value: 'P2 P1', label: 'P2 -> P1' },
        { value: 'P2 P5', label: 'P2 -> P5' },
        { value: 'P3 P2', label: 'P3 -> P2' },
        { value: 'P4 P2', label: 'P4 -> P2' },
        { value: 'P4 P5', label: 'P4 -> P5' },
        { value: 'P5 P3', label: 'P5 -> P3' },
      ]
    },

    graphRef: null,

    newLink: {
      from: null,
      to: null
    },

    newQuality: null,

    deleteLink: null,
    deletePage: null,

    options: {
      autoResize: true,
      layout: {
        hierarchical: false
      },
      edges: {
        color: '#000000',
        font: {
          size: 13,
          color: '#999'
        },
        smooth: {
          type: 'discrete'
        }
      },
      nodes: {
        size: 30,
        shape: 'dot',

        font: {
          color: '#000',
          strokeWidth: 5,
          size: 20
        }
      },
      physics: {
        enabled: true,
        barnesHut: {
          gravitationalConstant: -10000,
          centralGravity: 0.4
        }
      },

      interaction: {
        navigationButtons: true,
        keyboard: true
      },

      height: '850px'
    },

    modal: {
      open: false,
      type: null
    },

    pagerank: {
      dampening: 0.85,
      noIterations: 0,
      tolerance: 0.00000000001
    },

    solveDeadEnds: false,
    solveSpiderTraps: false,
    disconnectedJumps: false,
    samePageJumps: false,

    disconnectedJumpsQ: false,
    samePageJumpsQ: false,

    pageRankValues: [],

    quality: {
      noIterations: 0,
      elasticity: 1
    },
    qualityPageRankValues: [],

    baseQuality: [
      { id: 'P1', quality: 10 },
      { id: 'P2', quality: 10 },
      { id: 'P3', quality: 10 },
      { id: 'P4', quality: 10 },
      { id: 'P5', quality: 10 }
    ],

    hMatrix: null,

    showPageRank: false,
    showQuality: false,

    jump: 0,
    jumpPage: null,
    jumpPageSelect: null,

    jumpQ: 0,
    jumpPageQ: null,
    jumpPageSelectQ: null,

    showTooltips: false,
    useFractions: false

  }

  async componentDidMount() {
    await this.fullPageRank(true)
    await this.fullQualityPageRank()
  }

  // PAGERANK COMPUTATIONS ///////////////////////
  async fullPageRank(newHMatrix) {
    var start = []
    var initialVal = fraction(1, this.state.nodes.length)

    if (this.state.showTooltips) {
      toast.success('Computing the PageRank of each page', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "computingPagerank"
      });
    }

    // Compute initial vector
    for (let node of this.state.nodes) {
      start.push({ node: node.id, pr: initialVal })
    }
    var allNodes = []
    var i = 0
    for (let node of this.state.nodes) {
      allNodes.push({
        id: node.id,
        index: i,
        pr: initialVal,
        ingoing: 0,
        outgoing: 0
      })
      i++
    }

    // Compute Hyperlink Matrix
    if (newHMatrix) {
      await this.computeHyperLinkMatrix(allNodes)
    }
    //console.log(format(this.state.hMatrix, { fraction: 'decimal' }))

    // Compute iterations
    var curValArray = []
    for (let node of allNodes) {
      curValArray.push(node.pr)
    }
    curValArray = matrix(curValArray)

    if (this.state.showTooltips) {
      toast.warning('For each page, it\'s pagerank value is given by:\n PR(iteration) = PR(iteration-1) * HMatrix', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "pageRankExplanation"
      });
    }

    for (var i = 0; i < this.state.pagerank.noIterations; i++) {
      var nextValArray = multiply(transpose(curValArray), this.state.hMatrix)
      curValArray = nextValArray
    }

    // Update Values
    for (var j = 0; j < allNodes.length; j++) {
      allNodes.find(function (n, index) {
        if (n.index == j) return true
      }).pr = curValArray._data[j]
    }

    if (this.state.showTooltips) {
      toast.success('Finished computing PageRank of each page', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "finishedComputingPagerank"
      });
    }

    await this.setState({
      pageRankValues: allNodes
    })

  }

  pageRankToStabilization = async () => {
    var start = []
    var initialVal = fraction(1, this.state.nodes.length)

    if (this.state.showTooltips) {
      toast.success('Computing the PageRank until it stabilizes (i.e the sum difference of values, error, is less than 0.00000000001)', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "computingPagerankStab"
      });
    }

    // Compute initial vector
    for (let node of this.state.nodes) {
      start.push({ node: node.id, pr: initialVal })
    }
    var allNodes = []
    var i = 0
    for (let node of this.state.nodes) {
      allNodes.push({
        id: node.id,
        index: i,
        pr: initialVal,
        ingoing: 0,
        outgoing: 0
      })
      i++
    }

    // Compute Hyperlink Matrix
    await this.computeHyperLinkMatrix(allNodes)
    //console.log(format(this.state.hMatrix, { fraction: 'decimal' }))

    // Compute iterations
    var curValArray = []
    for (let node of allNodes) {
      curValArray.push(node.pr)
    }
    curValArray = matrix(curValArray)

    var iteration = 0
    for (iteration; iteration < 100000; iteration++) {
      var nextValArray = multiply(transpose(curValArray), this.state.hMatrix)

      var converged = true
      for (var j = 0; j < nextValArray._data.length; j++) {
        var next = format(nextValArray._data[j], { fraction: 'decimal' })
        var cur = format(curValArray._data[j], { fraction: 'decimal' })
        if (next - cur > this.state.pagerank.tolerance) {
          converged = false
          break
        }
      }
      if (converged) {
        curValArray = nextValArray
        iteration++
        break
      }

      curValArray = nextValArray
    }

    if (this.state.showTooltips) {
      toast.success('PageRank values have reached convergence!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "computingPagerankStabConv"
      });
    }

    // Update Values
    for (var j = 0; j < allNodes.length; j++) {
      allNodes.find(function (n, index) {
        if (n.index == j) return true
      }).pr = curValArray._data[j]
    }

    await this.setState({
      pageRankValues: allNodes,
      pagerank: {
        noIterations: iteration,
        dampening: this.state.pagerank.dampening,
        tolerance: this.state.pagerank.tolerance
      }
    })

  }

  async computeHyperLinkMatrix(allNodes) {
    var comp = this.state.nodes.length
    var hMatrix = matrix(zeros([comp, comp]))

    if (this.state.showTooltips) {
      toast.success('Computing the HyperLink Matrix', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "computingPagerankStab"
      });
    }

    if (allNodes == null) {
      allNodes = []
      var i = 0
      for (let node of this.state.nodes) {
        allNodes.push({ id: node.id, index: i })
        i++
      }
    }

    for (let node of allNodes) {
      var relations = []
      for (let relation of this.state.edges) {
        if (relation.to == node.id) {
          allNodes.find(function (n, index) {
            if (n.id == node.id) return true
          }).ingoing++
        }

        if (relation.from != node.id) {
          continue
        }

        relations.push(
          allNodes.find(function (n, index) {
            if (n.id == relation.to) return true
          })
        )

        allNodes.find(function (n, index) {
          if (n.id == node.id) return true
        }).outgoing++
      }
      var value = 0
      if (relations.length != 0) {
        value = fraction(1, relations.length)
      }

      for (let relation of relations) {
        if (relation == undefined || relation == null) {
          continue
        }
        hMatrix.subset(index(node.index, relation.index), value)
      }
    }

    hMatrix = hMatrix


    if (this.state.showTooltips) {
      toast.success('Finished computing the Hyperlink Matrix', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "computingPagerankStab"
      });
    }

    await this.setState({
      hMatrix: hMatrix
    })

    // If solve dead ends
    if (this.state.solveDeadEnds) {
      this.solveDeadEnds()
    }

    // If solve spider traps
    if (this.state.solveSpiderTraps) {
      this.solveSpiderTraps()
    }
  }

  async solveDeadEnds() {
    if (this.state.showTooltips) {
      toast.success('Solving DeadEnd pages', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "solvingDeadEnds"
      });
    }

    var initialVal = fraction(1, this.state.nodes.length)

    // 1xN vector of 1s
    var onesArray = ones(1, this.state.nodes.length)

    // Nx1 vector of 1 for dangling nodes, 0 for the others
    var danglers = zeros(this.state.nodes.length, 1)

    for (var i = 0; i < this.state.nodes.length; i++) {
      var rowZeros = true
      for (var j = 0; j < this.state.nodes.length; j++) {
        if (this.state.hMatrix.subset(index(i, j)) != 0) {
          rowZeros = false
          break
        }
      }

      if (rowZeros) {
        danglers.subset(index(i, 0), 1)
      }
    }

    var multi = multiply(danglers, onesArray)

    var dankHMatrix = multiply(initialVal, multi)

    if (this.state.showTooltips) {
      toast.success('Finished Solving DeadEnd pages', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "solvingDeadEndsFinished"
      });
    }

    var finalMatrix = add(this.state.hMatrix, dankHMatrix)
    await this.setState({
      hMatrix: finalMatrix
    })
  }

  async solveSpiderTraps() {
    if (this.state.showTooltips) {
      toast.success('Solving SpiderTraps - Set of Pages that link to each other and none other', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "solvingSpiderTraps"
      });

    }
    var initialVal = fraction(1, this.state.nodes.length)

    // 1xN vector of 1s
    var randomJump = multiply(initialVal, ones(this.state.nodes.length, this.state.nodes.length))

    var continuing = multiply(this.state.pagerank.dampening, this.state.hMatrix)

    var jumpProb = fraction(1 - this.state.pagerank.dampening)
    randomJump = multiply(jumpProb, randomJump)

    var finalMatrix = add(continuing, randomJump)

    if (this.state.showTooltips) {
      toast.success('Finished Solving SpiderTraps', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "solvingDeadEndsFinished"
      });
    }

    await this.setState({
      hMatrix: finalMatrix
    })
  }
  // PAGERANK COMPUTATIONS ///////////////////////


  // QUALITY PAGERANK COMPUTATIONS ///////////////////////
  async fullQualityPageRank() {
    if (this.state.showTooltips) {
      toast.success('Computing the Quality PageRank', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "computingQPR"
      });
    }

    //var qPRValues = [{ id: "Qa", base: 500, current: 500, quality: 10 }, { id: "Qb", base: 3, current: 3, quality: 12 }, { id: "Qc", base: 300, current: 300, quality: 6 }]
    var qPRValues = this.state.pageRankValues
    for (var i = 0; i < qPRValues.length; i++) {
      qPRValues[i].quality = this.state.baseQuality.find(element => element.id == qPRValues[i].id).quality
      qPRValues[i].base = qPRValues[i].pr
      qPRValues[i].current = qPRValues[i].pr
    }

    for (var i = 0; i < this.state.quality.noIterations; i++) {
      // First we get the averages
      var averageQuality = 0
      var marketSum = 0

      for (var j = 0; j < qPRValues.length; j++) {
        averageQuality += qPRValues[j].current * qPRValues[j].quality
        marketSum += qPRValues[j].current
      }

      averageQuality = averageQuality / marketSum

      for (var n = 0; n < qPRValues.length; n++) {
        var relativeQuality = qPRValues[n].quality / averageQuality
        var marketChange = this.state.quality.elasticity * (relativeQuality - 1)

        qPRValues[n].current = qPRValues[n].current + qPRValues[n].current * marketChange
      }

    }

    if (this.state.showTooltips) {
      toast.success('Finished computing the Quality PageRank', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "computingQPR7"
      });
    }

    await this.setState({ qualityPageRankValues: qPRValues })
  }
  // QUALITY PAGERANK COMPUTATIONS ///////////////////////


  // PAGERANK CONTROLS ///////////////////////
  increaseIteration = async () => {
    var noIterations = this.state.pagerank.noIterations
    noIterations++
    await this.setState({
      pagerank: {
        noIterations: noIterations,
        dampening: this.state.pagerank.dampening,
        tolerance: this.state.pagerank.tolerance
      }
    })

    this.fullPageRank(false)
  }

  decreaseIteration = async () => {
    var noIterations = this.state.pagerank.noIterations
    noIterations--
    await this.setState({
      pagerank: {
        noIterations: noIterations,
        dampening: this.state.pagerank.dampening,
        tolerance: this.state.pagerank.tolerance
      }
    })

    this.fullPageRank(false)
  }

  jumpToIteration = async () => {
    var error = false
    var iteration = document.getElementById('jumpToIteration')
    if (
      iteration === null ||
      iteration.value === ''
    ) {
      iteration = 0
      document.getElementById('errorNotDigit').style.display = 'none'

    } else if (/^\d+$/.test(iteration.value)) {
      iteration = iteration.value
      document.getElementById('errorNotDigit').style.display = 'none'

      if (iteration > 100000) {
        error = true
        document.getElementById('errorTooBig').style.display = ''
      } else {
        document.getElementById('errorTooBig').style.display = 'none'
      }

    } else {
      error = true
      document.getElementById('errorTooBig').style.display = 'none'
      document.getElementById('errorNotDigit').style.display = ''
    }




    if (!error) {
      await this.setState({
        pagerank: {
          noIterations: iteration,
          dampening: this.state.pagerank.dampening,
          tolerance: this.state.pagerank.tolerance
        }
      })

      await this.fullPageRank(false)

      this.handleClose()
    }

  }
  // PAGERANK CONTROLS ///////////////////////


  // QUALITY CONTROLS //////////////////////
  increaseIterationQuality = async () => {
    var noIterations = this.state.quality.noIterations
    noIterations++
    await this.setState({
      quality: {
        noIterations: noIterations,
        elasticity: this.state.quality.elasticity
      }
    })

    this.fullQualityPageRank()
  }

  decreaseIterationQuality = async () => {
    var noIterations = this.state.quality.noIterations
    noIterations--
    await this.setState({
      quality: {
        noIterations: noIterations,
        elasticity: this.state.quality.elasticity
      }
    })

    this.fullQualityPageRank()
  }

  jumpToIterationQuality = async () => {
    var error = false
    var iteration = document.getElementById('jumpToIterationQ')
    if (
      iteration === null ||
      iteration.value === ''
    ) {
      iteration = 0
      document.getElementById('errorNotDigit').style.display = 'none'

    } else if (/^\d+$/.test(iteration.value)) {
      iteration = iteration.value
      document.getElementById('errorNotDigit').style.display = 'none'

      if (iteration > 100000) {
        error = true
        document.getElementById('errorTooBig').style.display = ''
      } else {
        document.getElementById('errorTooBig').style.display = 'none'
      }

    } else {
      error = true
      document.getElementById('errorTooBig').style.display = 'none'
      document.getElementById('errorNotDigit').style.display = ''
    }




    if (!error) {
      await this.setState({
        quality: {
          noIterations: iteration,
          elasticity: this.state.quality.elasticity
        }
      })

      await this.fullQualityPageRank()

      this.handleClose()
    }

  }

  changeElasticity = async () => {
    var error = false
    var elasticity = document.getElementById('changeElasticityValue')
    if (
      elasticity === null ||
      elasticity.value === ''
    ) {
      document.getElementById('errorWrongNumber').style.display = 'none'
      error = true
      this.handleClose()

    } else if (!isNaN(elasticity.value)) {
      elasticity = elasticity.value
      document.getElementById('errorWrongNumber').style.display = 'none'

      if (elasticity > 100 || elasticity < 0) {
        error = true
        document.getElementById('errorWrongNumber').style.display = ''
      } else {
        document.getElementById('errorWrongNumber').style.display = 'none'
      }

    } else {
      error = true
      document.getElementById('errorWrongNumber').style.display = ''
    }

    if (!error) {
      elasticity = elasticity / 100
      await this.setState({
        quality: {
          noIterations: this.state.quality.noIterations,
          elasticity: elasticity
        }
      })

      await this.fullQualityPageRank()

      this.handleClose()
    }

  }
  // QUALITY CONTROLS /////////////////////


  // SURFER CONTROLS ///////////////////////
  jumpToNode = async (randomJump, newNode) => {

    if (this.state.jumpPage != null) {
      var oldId = null
      if (this.state.jumpPage.id != null && this.state.jumpPage.id != undefined) {
        oldId = this.state.jumpPage.id
      } else {
        oldId = this.state.jumpPage.value
      }

      try {
        this.state.graphRef.clustering.updateClusteredNode(oldId, {
          color: null
        })
      } catch (e) {

      }

    }

    var nodeId = null
    if (randomJump) {
      nodeId = newNode.id
    } else {
      nodeId = newNode.value
    }

    await this.setState({ jumpPage: newNode })
    this.state.graphRef.clustering.updateClusteredNode(nodeId, {
      color: {
        border: '#f50057',
        background: '#fa7faa',
      }
    })
    this.state.graphRef.focus(nodeId, {
      animation: {
        duration: 100,
        easingFunction: 'linear'
      },
    })

    if (!randomJump) {
      await this.setState({ jump: 1 })
    }

    if (!randomJump) {
      this.handleClose()
    }
  }

  stop = async () => {
    if (this.state.jumpPage != null) {
      var oldId = null
      if (this.state.jumpPage.id != null && this.state.jumpPage.id != undefined) {
        oldId = this.state.jumpPage.id
      } else {
        oldId = this.state.jumpPage.value
      }

      try {
        this.state.graphRef.clustering.updateClusteredNode(oldId, {
          color: null
        })
      } catch (e) {

      }
    }

    await this.setState({ jump: 0, jumpPage: null })
  }

  async getRandomNode() {
    function compare(a, b) {
      if (a.pr < b.pr) {
        return -1;
      }
      if (a.pr > b.pr) {
        return 1;
      }
      return 0;
    }

    var pageRankValues = [...this.state.pageRankValues];
    pageRankValues = pageRankValues.sort(compare)

    for (var attempt = 0; attempt < 500; attempt++) {
      console.log(attempt)
      var randomNumber = Math.random()
      var threshold = 0;
      var winner = null

      for (let i = 0; i < pageRankValues.length; i++) {
        threshold += pageRankValues[i].pr;
        if (threshold > randomNumber) {
          winner = pageRankValues[i]
          break
        }
      }

      if (winner != null) {
        var violation = false

        // Treat same page jumps
        if (this.state.jumpPage != null && (winner.id == this.state.jumpPage.id || winner.id == this.state.jumpPage.value) && !this.state.samePageJumps) {
          violation = true
        }

        // Treat disconnected jumps
        if (this.state.jumpPage != null && !this.state.disconnectedJumps) {
          console.log("Verifying Edge Exists")
          var containsLink = false
          var id
          if (this.state.jumpPage.id != null && this.state.jumpPage.id != undefined) {
            id = this.state.jumpPage.id
          } else {
            id = this.state.jumpPage.value
          }

          for (let relation of this.state.edges) {
            if (relation.from == id && relation.to == winner.id) {
              console.log(relation)
              containsLink = true
              break
            }
          }

          if (!containsLink) {
            console.log("Edge does not exist")
            violation = true
          }
        }

        if (!violation) {
          return winner
        }
      }
    }

    return null
  }

  randomJump = async () => {
    if (this.state.showTooltips) {
      toast.success('Jumping to a random page in accordance to the current PageRank values', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "randomJump1"
      });
    }

    var winner = await this.getRandomNode()

    if (winner == null) {
      toast.error('Sorry, the surfer wasn\'t able to make a jump! Perhaps the surfer\'s reached a Dead End and has nowhere to jump to! Change the network configuration, manually jump to the node you wish to visit or try again!', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } else {
      var curJump = this.state.jump
      curJump++

      await this.setState({ jump: curJump })

      await this.jumpToNode(true, winner)
    }
  }
  // SURFER CONTROLS ///////////////////////

  // QUALITY SURFER CONTROLS ///////////////////////
  jumpToNodeQuality = async (randomJump, newNode) => {

    if (this.state.jumpPageQ != null) {
      var oldId = null
      if (this.state.jumpPageQ.id != null && this.state.jumpPageQ.id != undefined) {
        oldId = this.state.jumpPageQ.id
      } else {
        oldId = this.state.jumpPageQ.value
      }

      try {
        this.state.graphRef.clustering.updateClusteredNode(oldId, {
          color: null
        })
      } catch (e) {

      }

    }

    var nodeId = null
    if (randomJump) {
      nodeId = newNode.id
    } else {
      nodeId = newNode.value
    }

    await this.setState({ jumpPageQ: newNode })
    this.state.graphRef.clustering.updateClusteredNode(nodeId, {
      color: {
        border: '#1a8749',
        background: '#5be396',
      }
    })
    this.state.graphRef.focus(nodeId, {
      animation: {
        duration: 100,
        easingFunction: 'linear'
      },
    })

    if (!randomJump) {
      await this.setState({ jumpQ: 1 })
    }

    if (!randomJump) {
      this.handleClose()
    }
  }

  stopQuality = async () => {
    if (this.state.jumpPageQ != null) {
      var oldId = null
      if (this.state.jumpPageQ.id != null && this.state.jumpPageQ.id != undefined) {
        oldId = this.state.jumpPageQ.id
      } else {
        oldId = this.state.jumpPageQ.value
      }

      try {
        this.state.graphRef.clustering.updateClusteredNode(oldId, {
          color: null
        })
      } catch (e) {

      }
    }

    await this.setState({ jump: 0, jumpPage: null })
  }

  async getRandomNodeQuality() {
    function compare(a, b) {
      if (a.current < b.current) {
        return -1;
      }
      if (a.current > b.current) {
        return 1;
      }
      return 0;
    }

    var pageRankValues = [...this.state.qualityPageRankValues];
    pageRankValues = pageRankValues.sort(compare)

    for (var attempt = 0; attempt < 500; attempt++) {
      var randomNumber = Math.random()
      var threshold = 0;
      var winner = null

      for (let i = 0; i < pageRankValues.length; i++) {
        threshold += pageRankValues[i].current;
        if (threshold > randomNumber) {
          winner = pageRankValues[i]
          break
        }
      }

      if (winner != null) {
        var violation = false

        // Treat same page jumps
        if (!this.state.samePageJumpsQ && this.state.jumpPageQ != null && (winner.id == this.state.jumpPageQ.id || winner.id == this.state.jumpPageQ.value)) {
          violation = true
        }

        // Treat disconnected jumps
        if (!this.state.disconnectedJumpsQ && this.state.jumpPageQ != null) {
          var containsLink = false
          var id
          if (this.state.jumpPageQ.id != null && this.state.jumpPageQ.id != undefined) {
            id = this.state.jumpPageQ.id
          } else {
            id = this.state.jumpPageQ.value
          }

          for (let relation of this.state.edges) {
            if (relation.from == id && relation.to == winner.id) {
              containsLink = true
              break
            }
          }

          if (!containsLink) {
            violation = true
          }
        }

        if (!violation) {
          return winner
        }
      }
    }

    return null
  }

  randomJumpQuality = async () => {
    if (this.state.showTooltips) {
      toast.success('Jumping to a random page in accordance to the current Quality PageRank values', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        toastId: "randomJump1"
      });
    }


    var winner = await this.getRandomNodeQuality()

    if (winner == null) {
      toast.error('Sorry, the surfer wasn\'t able to make a jump! Perhaps the surfer\'s reached a Dead End and has nowhere to jump to! Change the network configuration, manually jump to the node you wish to visit or try again!', {
        position: "top-right",
        autoClose: 7500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
    } else {
      var curJump = this.state.jumpQ
      curJump++

      await this.setState({ jumpQ: curJump })

      await this.jumpToNodeQuality(true, winner)
    }
  }
  // QUALITY SURFER CONTROLS ///////////////////////


  // MODAL CONTROLS ///////////////////////
  handleOpenAdd = () => {
    this.setState({
      modal: {
        open: true,
        type: 'ADD_NODE'
      }
    })
  }

  handleOpenAddLink = () => {
    this.setState({
      modal: {
        open: true,
        type: 'ADD_LINK'
      }
    })
  }

  handleOpenDeleteLink = () => {
    this.setState({
      modal: {
        open: true,
        type: 'REMOVE_LINK'
      }
    })
  }

  handleOpenDeleteNode = () => {
    this.setState({
      modal: {
        open: true,
        type: 'REMOVE_NODE'
      }
    })
  }

  handleOpenHyperLink = () => {
    this.setState({
      modal: {
        open: true,
        type: 'SHOW_HYPERLINK'
      }
    })
  }

  handleShowHidePageRank = () => {
    var show = this.state.showPageRank
    var quality = this.state.showQuality
    if (show == false) {
      quality = false
    }
    this.setState({
      showPageRank: !show,
      showQuality: quality
    })
  }

  handleShowHideQuality = async () => {
    var show = this.state.showQuality
    var rank = this.state.showPageRank
    if (show == false) {
      rank = false
      await this.fullQualityPageRank()
    }
    this.setState({
      showPageRank: rank,
      showQuality: !show,
    })
  }

  handleOpenJumpToIteration = () => {
    this.setState({
      modal: {
        open: true,
        type: 'SHOW_JUMP_TO_ITERATION'
      }
    })
  }

  handleOpenJumpToIterationQuality = () => {
    this.setState({
      modal: {
        open: true,
        type: 'SHOW_JUMP_TO_ITERATION_QUALITY'
      }
    })
  }

  handleOpenJumpTo = () => {
    this.setState({
      modal: {
        open: true,
        type: 'JUMP_TO'
      }
    })
  }

  handleOpenJumpToQuality = () => {
    this.setState({
      modal: {
        open: true,
        type: 'JUMP_TO_QUALITY'
      }
    })
  }

  handleOpenTweakQuality = () => {
    this.setState({
      modal: {
        open: true,
        type: 'TWEAK_QUALITY'
      }
    })
  }

  handleOpenChangeElasticity = () => {
    this.setState({
      modal: {
        open: true,
        type: 'CHANGE_ELASTICITY'
      }
    })
  }

  handleOpenExplainSpider = () => {
    this.setState({
      modal: {
        open: true,
        type: 'EXPLAIN_SPIDERTRAPS'
      }
    })
  }

  handleOpenExplainDead = () => {
    this.setState({
      modal: {
        open: true,
        type: 'EXPLAIN_DEADENDS'
      }
    })
  }

  handleOpenExplainPageRank = () => {
    this.setState({
      modal: {
        open: true,
        type: 'EXPLAIN_PAGERANK'
      }
    })
  }

  handleOpenExplainRandomSurfer = () => {
    this.setState({
      modal: {
        open: true,
        type: 'EXPLAIN_RANDOMSURFER'
      }
    })
  }

  handleOpenExplainHyperlink = () => {
    this.setState({
      modal: {
        open: true,
        type: 'EXPLAIN_HYPERLINK'
      }
    })
  }

  handleOpenExplainQualityPR = () => {
    this.setState({
      modal: {
        open: true,
        type: 'EXPLAIN_QUALITYPAGERANK'
      }
    })
  }

  handleOpenExplainElasticity = () => {
    this.setState({
      modal: {
        open: true,
        type: 'EXPLAIN_ELASTICITY'
      }
    })
  }

  handleCloseHyperlink = () => {
    this.setState({
      modal: {
        open: true,
        type: 'SHOW_HYPERLINK'
      }
    })
  }

  handleClose = () => {
    this.setState({
      jumpPageSelect: null,
      newQuality: null,
      modal: {
        open: false,
        type: null
      }
    })
  }

  // MODAL CONTROLS ///////////////////////

  // SELECT CONTROLS ///////////////////////
  changeNewFromPage = async selectedOption => {
    if (selectedOption != null) {
      await this.setState({
        newLink: { from: selectedOption, to: this.state.newLink.to }
      })
    } else {
      await this.setState({
        newLink: { from: null, to: this.state.newLink.to }
      })
    }
  }

  changeQualityPage = async selectedOption => {
    if (selectedOption != null) {
      document.getElementById("newQualityInput").value = this.state.baseQuality.find(element => element.id == selectedOption.value).quality
      await this.setState({
        newQuality: selectedOption
      })
    } else {
      document.getElementById("newQualityInput").value = null
      await this.setState({
        newQuality: null
      })
    }
  }

  changeNewToPage = async selectedOption => {
    if (selectedOption != null) {
      await this.setState({
        newLink: { from: this.state.newLink.from, to: selectedOption }
      })
    } else {
      await this.setState({
        newLink: { from: this.state.newLink.from, to: null }
      })
    }
  }

  changeDeleteLink = async selectedOption => {
    if (selectedOption != null) {
      await this.setState({ deleteLink: selectedOption })
    } else {
      await this.setState({ deleteLink: null })
    }
  }

  changeDeleteNode = async selectedOption => {
    if (selectedOption != null) {
      await this.setState({ deletePage: selectedOption })
    } else {
      await this.setState({ deletePage: null })
    }
  }

  changeJumpNode = async selectedOption => {
    if (selectedOption != null) {
      await this.setState({ jumpPageSelect: selectedOption })
    } else {
      await this.setState({ jumpPageSelect: null })
    }
  }

  // SELECT CONTROLS ///////////////////////


  // CHECK CONTROLS ///////////////////////
  changeSolveDeadEnds = async () => {
    var current = this.state.solveDeadEnds
    await this.setState({ solveDeadEnds: !current })
    this.fullPageRank(true)
  }

  changeSolveSpiderTraps = async () => {
    var current = this.state.solveSpiderTraps
    await this.setState({ solveSpiderTraps: !current })
    this.fullPageRank(true)

  }

  changeDisconnectedJumps = async () => {
    var current = this.state.disconnectedJumps
    await this.setState({ disconnectedJumps: !current })
  }

  changeSamePageJumps = async () => {
    var current = this.state.samePageJumps
    await this.setState({ samePageJumps: !current })
  }

  changeDisconnectedJumpsQuality = async () => {
    var current = this.state.disconnectedJumpsQ
    await this.setState({ disconnectedJumpsQ: !current })
  }

  changeSamePageJumpsQuality = async () => {
    var current = this.state.samePageJumpsQ
    await this.setState({ samePageJumpsQ: !current })
  }

  changeShowToolTips = async () => {
    var current = this.state.showTooltips
    await this.setState({ showTooltips: !current })
  }

  changeUseFractions = async () => {
    var current = this.state.useFractions
    await this.setState({ useFractions: !current })
  }

  // CHECK CONTROLS ///////////////////////


  // GRAPH CONTROLS ///////////////////////
  addNewNode = async () => {
    var error = false

    var name = document.getElementById('newNodeName')
    if (
      name === null ||
      name.value === '' ||
      name.value.replace(' ', '') === ''
    ) {
      document.getElementById('errorNoName').style.display = ''
      error = true
    } else {
      name = name.value
      document.getElementById('errorNoName').style.display = 'none'

      var already_exists = false

      for (let node of this.state.nodes) {
        if (node.label === name) {
          already_exists = true
          break
        }
      }

      if (already_exists) {
        document.getElementById('errorNameAlreadyExists').style.display = ''
        error = true
      } else {
        document.getElementById('errorNameAlreadyExists').style.display = 'none'
      }
    }

    if (!error) {
      name.replace(' ', '_')

      var newNodes = []
      for (let node of this.state.nodes) {
        newNodes.push(node)
      }

      newNodes.push({ id: name, label: name })

      var selectNewNodes = this.state.selects.nodes
      selectNewNodes.push({ value: name, label: name })

      var baseQuality = this.state.baseQuality

      baseQuality.push({ id: name, quality: 10 })

      await this.setState({
        nodes: newNodes,
        selects: {
          nodes: selectNewNodes,
          edges: this.state.selects.edges
        },
        baseQuality: baseQuality
      })

      await this.fullPageRank(true)
      await this.fullQualityPageRank()

      await this.state.graphRef.body.emitter.emit('_dataChanged')
      await this.state.graphRef.redraw()

      this.handleClose()
    }
  }

  addNewLink = async () => {
    var error = false

    var from = this.state.newLink.from
    var to = this.state.newLink.to

    if (from === null || from.value === '' || to === null || to.value === '') {
      document.getElementById('errorNoLink').style.display = ''
      error = true
    } else {
      from = from.value
      to = to.value

      document.getElementById('errorNoLink').style.display = 'none'

      if (from === to) {
        document.getElementById('errorLinkSameNode').style.display = ''
        error = true
      } else {
        var already_exists = false

        for (let relation of this.state.edges) {
          if (relation.from === from && relation.to === to) {
            already_exists = true
            break
          }
        }

        if (already_exists) {
          document.getElementById('errorLinkAlreadyExists').style.display = ''
          error = true
        } else {
          document.getElementById('errorLinkAlreadyExists').style.display =
            'none'
        }
      }
    }

    if (!error) {
      var newLinks = []
      for (let relation of this.state.edges) {
        newLinks.push(relation)
      }

      newLinks.push({ from: from, to: to })

      var selectNewLinks = this.state.selects.edges
      selectNewLinks.push({ value: from + ' ' + to, label: from + ' -> ' + to })

      await this.setState({
        edges: newLinks,
        selects: {
          nodes: this.state.selects.nodes,
          edges: selectNewLinks
        },
        newLink: {
          from: null,
          to: null
        }
      })

      await this.fullPageRank(true)
      await this.fullQualityPageRank()

      await this.state.graphRef.body.emitter.emit('_dataChanged')
      await this.state.graphRef.redraw()

      this.handleClose()
    }
  }

  removeLink = async () => {
    var error = false

    var link = this.state.deleteLink

    if (link === null || link.value === '') {
      document.getElementById('errorNoDeleteLink').style.display = ''
      error = true
    } else {
      link = link.value
      document.getElementById('errorNoDeleteLink').style.display = 'none'
    }

    if (!error) {
      var newLinks = []
      var from = link.split(' ')[0]
      var to = link.split(' ')[1]

      for (let relation of this.state.edges) {
        if (relation.from === from && relation.to === to) {
          continue
        } else {
          newLinks.push(relation)
        }
      }

      var selectNewLinks = []
      for (let relation of this.state.selects.edges) {
        if (
          relation.value.split(' ')[0] === from &&
          relation.value.split(' ')[1] === to
        ) {
          continue
        } else {
          selectNewLinks.push(relation)
        }
      }

      await this.setState({
        edges: newLinks,
        selects: {
          nodes: this.state.selects.nodes,
          edges: selectNewLinks
        },
        deleteLink: null
      })

      await this.fullPageRank(true)
      await this.fullQualityPageRank()

      await this.state.graphRef.body.emitter.emit('_dataChanged')
      await this.state.graphRef.redraw()

      this.handleClose()
    }
  }

  removePage = async () => {
    var error = false

    var page = this.state.deletePage

    if (page === null || page.value === '') {
      document.getElementById('errorNoDeletePage').style.display = ''
      error = true
    } else {
      page = page.value
      document.getElementById('errorNoDeletePage').style.display = 'none'
    }

    if (!error) {
      var newPages = []

      for (let node of this.state.nodes) {
        if (node.id === page) {
          continue
        } else {
          newPages.push(node)
        }
      }

      var baseQuality = []
      for (let node of this.state.baseQuality) {
        if (node.id === page) {
          continue
        } else {
          baseQuality.push(node)
        }
      }

      var selectNewNodes = []
      for (let node of this.state.selects.nodes) {
        if (node.value === page) {
          continue
        } else {
          selectNewNodes.push(node)
        }
      }

      var newLinks = []
      for (let relation of this.state.edges) {
        if (relation.from === page || relation.to === page) {
          continue
        } else {
          newLinks.push(relation)
        }
      }

      var selectNewLinks = []
      for (let relation of this.state.selects.edges) {
        if (
          relation.value.split(' ')[0] === page ||
          relation.value.split(' ')[1] === page
        ) {
          continue
        } else {
          selectNewLinks.push(relation)
        }
      }

      if (this.state.jumpPage != null) {
        var oldId = null
        if (this.state.jumpPage.id != null && this.state.jumpPage.id != undefined) {
          oldId = this.state.jumpPage.id
        } else {
          oldId = this.state.jumpPage.value
        }

        if (page == oldId) {
          await this.setState({ jump: 0, jumpPage: null })
        }
      }

      if (this.state.jumpPageQ != null) {
        var oldId = null
        if (this.state.jumpPageQ.id != null && this.state.jumpPageQ.id != undefined) {
          oldId = this.state.jumpPageQ.id
        } else {
          oldId = this.state.jumpPageQ.value
        }

        if (page == oldId) {
          await this.setState({ jumpQ: 0, jumpPageQ: null })
        }
      }

      await this.setState({
        nodes: newPages,
        edges: newLinks,
        selects: {
          nodes: selectNewNodes,
          edges: selectNewLinks
        },
        deletePage: null,
        baseQuality: baseQuality
      })

      await this.fullPageRank(true)
      await this.fullQualityPageRank()

      await this.state.graphRef.body.emitter.emit('_dataChanged')
      await this.state.graphRef.redraw()

      this.handleClose()
    }
  }

  changeQuality = async () => {
    var error = false

    var newQualityValue = document.getElementById('newQualityInput')
    console.log(newQualityValue.value)

    if (
      newQualityValue === null ||
      newQualityValue.value === ''
    ) {
      document.getElementById('errorInvalidQuality').style.display = ''
      error = true
    } else {
      newQualityValue = newQualityValue.value
      document.getElementById('errorInvalidQuality').style.display = 'none'

      if (!/^\+?(0|[1-9]\d*)$/.test(newQualityValue)) {
        document.getElementById('errorInvalidQuality').style.display = ''
        error = true
      } else {
        document.getElementById('errorInvalidQuality').style.display = 'none'
      }
    }

    if (this.state.newQuality == null || this.state.newQuality == "") {
      document.getElementById('errorNoPage').style.display = ''
      error = true
    } else {
      document.getElementById('errorNoPage').style.display = 'none'
    }


    if (!error) {

      var baseQuality = []
      for (let node of this.state.baseQuality) {
        if (node.id == this.state.newQuality.value) {
          baseQuality.push({ id: node.id, quality: newQualityValue })
        } else {
          baseQuality.push(node)
        }
      }

      await this.setState({
        baseQuality: baseQuality
      })

      this.fullQualityPageRank()

      this.handleClose()
    }
  }

  // GRAPH CONTROLS ///////////////////////

  keydown(e) {
    if (e.keyCode == 13) {
      try {
        document.getElementById('confirm').click()
      } catch (error) {
        console.log()
      }
    }
  }

  render() {
    const { classes } = this.props
    var modal = <div></div>
    if (this.state.modal.open) {
      if (this.state.modal.type === 'ADD_NODE') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'Add a new Page'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px' }}>
              <TextField
                id='newNodeName'
                label='Page Name'
                variant='outlined'
                fullWidth={true}
                onKeyDown={this.keydown}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNoName'
              >
                Please specify a name for the new page!
              </span>
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNameAlreadyExists'
              >
                Sorry, there already exists a page with that name!
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                id='confirm'
                onClick={() => this.addNewNode()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'ADD_LINK') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            classes={{ paperScrollPaper: classes.root }}
          >
            <DialogTitle id='alert-dialog-title'>
              {'Add a new Link'}
            </DialogTitle>
            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <h4 style={{ color: '#999' }}>From page...</h4>
              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='Starting Page'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.nodes}
                onChange={this.changeNewFromPage}
                value={this.state.newLink.from || ''}
              />
            </DialogContent>

            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <h4 style={{ color: '#999' }}>To page...</h4>

              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='End Page'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.nodes}
                onChange={this.changeNewToPage}
                value={this.state.newLink.to || ''}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNoLink'
              >
                Please both the start and end node!
              </span>
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorLinkAlreadyExists'
              >
                Sorry, there already exists a link between those two pages!
              </span>
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorLinkSameNode'
              >
                Sorry, the start and end page must be different!
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                onClick={() => this.addNewLink()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'REMOVE_LINK') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            classes={{ paperScrollPaper: classes.root }}
          >
            <DialogTitle id='alert-dialog-title'>{'Delete a Link'}</DialogTitle>
            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='Link'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.edges}
                onChange={this.changeDeleteLink}
                value={this.state.deleteLink || ''}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNoDeleteLink'
              >
                Please select the link you want to delete!
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                onClick={() => this.removeLink()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'REMOVE_NODE') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            classes={{ paperScrollPaper: classes.root }}
          >
            <DialogTitle id='alert-dialog-title'>{'Delete a Page'}</DialogTitle>
            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='Page'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.nodes}
                onChange={this.changeDeleteNode}
                value={this.state.deletePage || ''}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNoDeletePage'
              >
                Please select the node you want to delete!
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                onClick={() => this.removePage()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'JUMP_TO') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            classes={{ paperScrollPaper: classes.root }}
          >
            <DialogTitle id='alert-dialog-title'>{'Travel to a Page'}</DialogTitle>
            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='Page'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.nodes}
                onChange={this.changeJumpNode}
                value={this.state.jumpPageSelect || ''}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNoDeletePage'
              >
                Please select the node you want to jump to!
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                onClick={() => this.jumpToNode(false, this.state.jumpPageSelect)}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'SHOW_HYPERLINK') {
        var i = 0
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            classes={{ paperScrollPaper: classes.root }}
            maxWidth="lg"
          >
            <DialogTitle id='alert-dialog-title'>{'HyperLink Matrix'} {this.state.solveDeadEnds && this.state.solveSpiderTraps ? ' (Google Matrix)' : ''}
              <span style={{ marginLeft: "5px", fontSize: "16px" }}><i class="fas fa-info-circle fa-sm" style={{ color: "#4758b8", cursor: "pointer" }} onClick={() => this.handleOpenExplainHyperlink()}></i></span>
            </DialogTitle>
            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px', maxWidth: "1500px" }}
            >
              <TableContainer>
                <div style={{ overflow: 'auto', maxHeight: '1000px' }}>
                  <Table style={{ tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell>Page/Page</TableCell>
                        {this.state.nodes.map(node => (
                          <TableCell align='left'>
                            <b>{node.id}</b>
                          </TableCell>
                        ))}

                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {this.state.hMatrix._data.map(row => (
                        <TableRow>
                          <TableCell align='left'>
                            <b>{this.state.nodes[i++].id}</b>
                          </TableCell>

                          {row.map(page =>
                            <TableCell align='left'>
                              {this.state.useFractions ? format(round(page, 10), {
                                fraction: 'fraction'
                              }) : format(round(page, 10), {
                                fraction: 'decimal'
                              })}
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TableContainer>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Exit
              </Button>
            </DialogActions>
          </Dialog >
        )
      } else if (this.state.modal.type === 'SHOW_JUMP_TO_ITERATION') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'Jump to Iteration'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px' }}>
              <TextField
                id='jumpToIteration'
                label='Iteration Number'
                variant='outlined'
                fullWidth={true}
                onKeyDown={this.keydown}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNotDigit'
              >
                Please specify a number (without any letters or symbols)
              </span>
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorTooBig'
              >
                Sorry, the limit of iterations is 100000...
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                id='confirm'
                onClick={() => this.jumpToIteration()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'ADD_LINK') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            classes={{ paperScrollPaper: classes.root }}
          >
            <DialogTitle id='alert-dialog-title'>
              {'Add a new Link'}
            </DialogTitle>
            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <h4 style={{ color: '#999' }}>From page...</h4>
              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='Starting Page'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.nodes}
                onChange={this.changeNewFromPage}
                value={this.state.newLink.from || ''}
              />
            </DialogContent>

            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <h4 style={{ color: '#999' }}>To page...</h4>

              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='End Page'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.nodes}
                onChange={this.changeNewToPage}
                value={this.state.newLink.to || ''}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNoLink'
              >
                Please both the start and end node!
              </span>
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorLinkAlreadyExists'
              >
                Sorry, there already exists a link between those two pages!
              </span>
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorLinkSameNode'
              >
                Sorry, the start and end page must be different!
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                onClick={() => this.addNewLink()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'TWEAK_QUALITY') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            classes={{ paperScrollPaper: classes.root }}
          >
            <DialogTitle id='alert-dialog-title'>
              {'Change Page\'s Quality'}
            </DialogTitle>
            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <h4 style={{ color: '#999' }}>Page...</h4>
              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='Starting Page'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.nodes}
                onChange={this.changeQualityPage}
                value={this.state.newQuality || ''}
              />
            </DialogContent>

            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <h4 style={{ color: '#999' }}>Quality</h4>

              <TextField
                id='newQualityInput'
                variant='outlined'
                fullWidth={true}
                onKeyDown={this.keydown}
              />

            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNoPage'
              >
                Please specify the page you want to change the quality of.
              </span>
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorInvalidQuality'
              >
                Please specify a positive, integer quality value.
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                onClick={() => this.changeQuality()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'SHOW_JUMP_TO_ITERATION_QUALITY') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'Jump to Iteration'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px' }}>
              <TextField
                id='jumpToIterationQ'
                label='Iteration Number'
                variant='outlined'
                fullWidth={true}
                onKeyDown={this.keydown}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNotDigit'
              >
                Please specify a number (without any letters or symbols)
              </span>
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorTooBig'
              >
                Sorry, the limit of iterations is 100000...
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                id='confirm'
                onClick={() => this.jumpToIterationQuality()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'JUMP_TO_QUALITY') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
            classes={{ paperScrollPaper: classes.root }}
          >
            <DialogTitle id='alert-dialog-title'>{'Travel to a Page'}</DialogTitle>
            <DialogContent
              className={classes.root}
              style={{ minWidth: '500px' }}
            >
              <Select
                className='basic-single'
                classNamePrefix='select'
                placeholder='Page'
                isClearable={true}
                isSearchable={true}
                options={this.state.selects.nodes}
                onChange={this.changeJumpNode}
                value={this.state.jumpPageSelect || ''}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorNoDeletePage'
              >
                Please select the node you want to jump to!
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                onClick={() => this.jumpToNodeQuality(false, this.state.jumpPageSelect)}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'CHANGE_ELASTICITY') {
        var label = "Elasticity Value (current value is " + this.state.quality.elasticity * 100 + "%)"
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'Change Elasticity'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px', overflow: "hidden" }}>
              <TextField
                id='changeElasticityValue'
                label={label}
                variant='outlined'
                fullWidth={true}
                onKeyDown={this.keydown}
              />
            </DialogContent>

            <DialogContent>
              <span
                style={{
                  paddingTop: '40px',
                  color: '#f50057',
                  display: 'none'
                }}
                id='errorWrongNumber'
              >
                Please pick a percentile number (between 0 and 100)
              </span>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
              <Button
                variant='outlined'
                color='primary'
                id='confirm'
                onClick={() => this.changeElasticity()}
              >
                Confirm
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'EXPLAIN_SPIDERTRAPS') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'SpiderTraps'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px', overflow: "hidden", marginTop: "0px" }}>
              <p><span style={{ color: "#f72f76" }}>Explanation: </span>Spider Traps are anomalies caused by a set of pages having outgoing links between each other, which causes our surfer to be forced to trable in a loop.</p>
              <p><span style={{ color: "#4758b8" }}>Solution: </span>To solve spider traps we basically want to give our surfer the possibility of not only entering pages by following links, but by also performing random jumps to disconnected pages (which correspond to the real life action of going to a page using bookmarks or inputting a URL directly).
                To do this we use a probability called <b>dampening</b> and create a new HyperLink matrix, given by mutiplying our default matrix with this value and summing it with a new matrix of equal probabilities, which we multiply by 1-D, where D is the dampening probability</p>
              <p style={{ color: "#4758b8", fontWeight: "bolder", textAlign: "center" }}>Ĥ = D * H + (1-D) * (1/n * Ones(nxn))</p>
              <p style={{}}><b>Ĥ</b> New HyperLink Matrix; <b>H</b> Current HyperLink Matrix; <b>D</b> Dampening Probability; <b>n</b> Number of pages; <b>Ones(nxn)</b> Matrix of dimension (nxn) filled with ones</p>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'EXPLAIN_DEADENDS') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'DeadEnds'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px', overflow: "hidden", marginTop: "0px" }}>
              <p><span style={{ color: "#f72f76" }}>Explanation: </span>DeadEnds are the name we give to nodes that have no outgoing links. If a surfer lands on this page he runs the risk of being stuck there without anyplace to go to. They're easy to identify in the HyperLink matrix since DeadEnds will have their whole row set to 0</p>
              <p><span style={{ color: "#4758b8" }}>Solution: </span>Solving these anomalies is easy and corresponds to giving the surfer a probability of, when in a DeadEnd page, jumping to any other page in the network.
                To solve DeadEnds we first identify them in the HyperLink matrix. We know a page is a Dead End if its row is filled with 0s. We'll cal the set of DeadEnd pages <b>Dangling Pages</b>.
                We do an additional computation - 1/n * (Dangling Nodes Array * Array of Ones) - where n is the number of pages we have and Array of Ones is an array of length n filled with 1s and Dangling Nodes Array is an (nx1) matrix with 0s in every normal page and 1 in the row corresponding to DeadEnd pages.
                Multiplying the Dangling Nodes with tha Array of Ones is going to create a new matrix of size nxn (the same size as the Hyperlink Matrix) with 0s on every row except for the ones that correspond to DeadEnd pages. We then multiply it by 1/n in order to give those pages an equal probability of jumping to any other page (even if they're not originally connected). This will make it so the random surfer doesn't get stuck and has somehwere to jump to.
                Our new HyperLink matrix is given by summing our old HyperLink matrix and the new matrix we computed in the previous steps.</p>
              <p style={{ color: "#4758b8", fontWeight: "bolder", textAlign: "center" }}>Ĥ = H + 1/n * (w * Ones(1xn))</p>
              <p style={{}}><b>Ĥ</b> New HyperLink Matrix; <b>H</b> Current HyperLink Matrix; <b>w</b> Matrix of dimensions (nx1) where each row that corresponds to a a Dangling Page has the value 1 whilst the others are set to 0; <b>n</b> Number of pages; <b>Ones(1xn)</b> Matrix of dimension (1xn) filled with ones</p>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'EXPLAIN_PAGERANK') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'PageRank'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px', overflow: "hidden", marginTop: "0px" }}>
              <p><span style={{ color: "#f72f76" }}>Explanation: </span>PageRank is an iterative algorithm that attempts to assign pages on a network a value corresponding to the probability of a user (also called a surfer) traveling to that page.</p>
              <p><span style={{ color: "#4758b8" }}>How it works: </span>This algorithm scores pages in accordance to the number of other pages that link to it. Being iterative at first each page starts with an equal probability of being started on (i.e the initial pagerank of all pages is given by 1/n where n is the number of pages).
              In each iteration a new value is calculated with the idea that at some point these values will converge to a stabilization (at which point we can stop the algorithm).</p>
              <p><span style={{ color: "#4758b8" }}>Computation: </span>To compute the PageRank we utilize an HyperLink matrix (a matrix in which each cell (i,j) (row i, column j) in the matrix represents the probability of going from page i to page j). For each iteration of the algorithm the value of each page's PageRank is given by the following equation:</p>
              <p style={{ color: "#4758b8", fontWeight: "bolder", textAlign: "center" }}>PR(i) = PR(i-1) * H</p>
              <p style={{}}><b>PR(i)</b> Array of PageRank values at iteration i; <b>PR(i-1)</b> Array of PageRank values at iteration i-1; <b>H</b> Current HyperLink Matrix;</p>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'EXPLAIN_RANDOMSURFER') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'Random Surfer'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px', overflow: "hidden", marginTop: "0px" }}>
              <p><span style={{ color: "#f72f76" }}>Explanation: </span>The Random Surfer intends to simulate the behaviour of a normal user travelling through the web. As such they travel to a page in accordance to the current PageRank values of the pages.</p>
              <p><span style={{ color: "#4758b8" }}>How it works: </span>We basically generate a random number between 0 and 1 and, in accordance to that number, try to pick the correspondant page to travel to (by stacking all pagerank values together, since they sum up to one)</p>
              <p><span style={{ color: "#f72f76" }}>Disconnected Jumps: </span>By enabling this option you'll allow the random surfer to jump to pages, even if the current page they're on doesn't directly link to it</p>
              <p><span style={{ color: "#f72f76" }}>Jumps to same Page: </span>By enabling this option you'll allow the random surfer to remain in the same page rather than jumping to another one</p>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'EXPLAIN_HYPERLINK') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'HyperLink Matrix'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px', overflow: "hidden", marginTop: "0px" }}>
              <p><span style={{ color: "#f72f76" }}>Explanation: </span>A matrix that contains the baseline probabilities of going from one page to another in the network.</p>
              <p><span style={{ color: "#4758b8" }}>How it works: </span>Each cell (i,j) (row i, column j) in the matrix represents the probability of going from page i to page j. This is calculated by giving each page an equal probability of leading to its outgoing links.</p>
              <p><span style={{ color: "#4758b8" }}>Restrictions: </span>Each row in the matrix should sum up to one. This restriction, however, is violated in case a node is a DeadEnd (i.e, has no outgoing links to any page). If not treated, this will make the random surfer get stuck and unable to leave this page.</p>
              <p><span style={{ color: "#4758b8" }}>What we use it for: </span>This matrix is useful in computing the PageRank iterations since we can simply multiply the previous iteration\'s PageRank values by the matrix to get the current iteration's values.</p>
              <p><span style={{ color: "#f72f76" }}>Google Matrix: </span>The Google Matrix is a special type of HyperLink Matrix that is achieved when we solve both DeadEnds and SpiderTraps anomalies.</p>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleCloseHyperlink()} color='secondary'>
                Back
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'EXPLAIN_QUALITYPAGERANK') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'Quality PageRank'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px', overflow: "hidden", marginTop: "0px" }}>
              <p><span style={{ color: "#f72f76" }}>Explanation: </span>The Quality PageRank is a modification to the PageRank algorithm that attempts to showcase the evolution of the pages' PageRank overtime in accordance to the quality of the content in the page.</p>
              <p><span style={{ color: "#4758b8" }}>How it works: </span>This algorithm follows the idea that if a page has more quality content, compared to others, surfers will be drawn to visit it over others, hence their PageRank will increase. By default, each page is ranked with a quality value of 10</p>
              <p><span style={{ color: "#4758b8" }}>Computation: </span>The computation is given by summing the current QPR (which at iteration 0 corresponds to the current PR) with the relative quality of the page multiplied with the elasticity value</p>
              <p style={{ color: "#4758b8", fontWeight: "bolder", textAlign: "center" }}>QPR(i) = QPR(i-1) * dQPR(i-1)</p>
              <p style={{}}><b>QPR(i)</b> Quality PageRank value of a given page at iteration i; <b>QPR(i-1)</b> Quality PageRank value of a given page at iteration i; <b>dQPR(i-1)</b> QPR changes;</p>

              <p style={{ color: "#4758b8", fontWeight: "bolder", textAlign: "center" }}>dQPR = E * (QR-1)</p>
              <p style={{}}><b>dQPR(i-1)</b> QPR changes for a given page; <b>E</b> Elasticity Value; <b>QR</b> Relative quality of a given page, given by dividing the page's quality by the average quality;</p>

              <p style={{ color: "#4758b8", fontWeight: "bolder", textAlign: "center" }}>Average Quality = sum(Q*PR) / sum(PR)</p>
              <p style={{}}>The average quality is given by suming the multiplication of each page by its PageRank value and then dividing this sum by the sum of all PageRank values (which should be 1)</p>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )
      } else if (this.state.modal.type === 'EXPLAIN_ELASTICITY') {
        modal = (
          <Dialog
            open={this.state.modal.open}
            onClose={() => this.handleClose()}
            aria-labelledby='alert-dialog-title'
            aria-describedby='alert-dialog-description'
          >
            <DialogTitle id='alert-dialog-title'>
              {'Elasticity'}
            </DialogTitle>
            <DialogContent style={{ minWidth: '500px', overflow: "hidden", marginTop: "0px" }}>
              <p><span style={{ color: "#f72f76" }}>Explanation: </span>The elasticity value is a percentile value that measures the resistence/impact quality has on a page's PageRank. The closer to 100 the value, the quicker pages will higher quality will see their QPR improve (and pages with lower quality see thier QPR decrease)</p>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => this.handleClose()} color='secondary'>
                Cancel
              </Button>
            </DialogActions>
          </Dialog>
        )
      }
    }

    var backIteration = 'none'
    if (this.state.pagerank.noIterations > 0) {
      backIteration = ''
    }


    var showPageRank = 'Show'
    var pagerank = null
    if (this.state.showPageRank) {
      showPageRank = 'Hide'
      pagerank = (
        <div style={{ position: 'absolute', top: '25px', right: '25px' }}>
          <Card style={{ width: '500px' }}>
            <CardContent style={{ overflow: "scroll" }}>
              <h2 style={{ color: '#38393b' }}>PageRank
              <span style={{ marginLeft: "5px", fontSize: "16px" }}><i class="fas fa-info-circle fa-sm" style={{ color: "#4758b8", cursor: "pointer" }} onClick={() => this.handleOpenExplainPageRank()}></i></span>
              </h2>

              <hr style={{ color: '#38393b', opacity: 0.2 }}></hr>

              <Grid container spacing={2} >
                <Grid item md={12}>
                  <h4 style={{ color: '#999' }}>
                    <i
                      class='fas fa-chevron-left fa-lg'
                      style={{
                        marginRight: '10px',
                        color: '#3f51b5',
                        cursor: 'pointer',
                        display: backIteration
                      }}
                      onClick={() => this.decreaseIteration()}
                    ></i>
                    Iteration {this.state.pagerank.noIterations}
                    <i
                      class='fas fa-chevron-right fa-lg'
                      style={{
                        marginLeft: '10px',
                        color: '#3f51b5',
                        cursor: 'pointer'
                      }}
                      onClick={() => this.increaseIteration()}
                    ></i>
                  </h4>
                  <TableContainer>
                    <Table aria-label='simple table'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Page</TableCell>
                          <TableCell align='left'>Ingoing Links</TableCell>
                          <TableCell align='left'>Outgoing Links</TableCell>
                          <TableCell align='left'>PageRank</TableCell>
                        </TableRow>
                      </TableHead>
                    </Table>
                    <Table aria-label='simple table'>
                      <div style={{ overflow: 'auto' }}>
                        <Table style={{ tableLayout: 'fixed', maxHeight: '300px' }}>
                          <TableBody>
                            {this.state.pageRankValues.map(pagerank => (
                              <TableRow key={pagerank.id}>
                                <TableCell align='left'>
                                  <b>{pagerank.id}</b>
                                </TableCell>
                                <TableCell align='left'>
                                  {pagerank.ingoing}
                                </TableCell>
                                <TableCell align='left'>
                                  {pagerank.outgoing}
                                </TableCell>
                                <TableCell align='left'>
                                  {this.state.useFractions ? format(round(pagerank.pr, 10), {
                                    fraction: 'fraction'
                                  }) : format(round(pagerank.pr, 10), {
                                    fraction: 'decimal'
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenJumpToIteration()}
                  >
                    Jump to Iteration
                  </Button>
                </Grid>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.pageRankToStabilization()}
                  >
                    Jump to Stabilization
                  </Button>
                </Grid>
              </Grid>

              <FormGroup row style={{ marginTop: '20px' }}>
                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.solveDeadEnds} checked={this.state.solveDeadEnds} onChange={() => this.changeSolveDeadEnds()} />}
                  label='Solve Dead Ends'
                />
                <span style={{ float: "left", marginRight: "20px" }}><i class="fas fa-info-circle fa-sm" style={{ color: "#4758b8", cursor: "pointer" }} onClick={() => this.handleOpenExplainDead()}></i></span>

                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.solveSpiderTraps} checked={this.state.solveSpiderTraps} onChange={() => this.changeSolveSpiderTraps()} />}
                  label='Solve Spider Traps'
                />

                <span style={{ float: "left", marginRight: "20px" }}><i class="fas fa-info-circle fa-sm" style={{ color: "#4758b8", cursor: "pointer" }} onClick={() => this.handleOpenExplainSpider()}></i></span>
              </FormGroup>

              <Grid item md={12} style={{ marginTop: "10px" }}>
                <span style={{ color: "#f50057" }}>{this.state.solveDeadEnds && this.state.solveSpiderTraps ? 'Achieved Google Matrix!' : ''}</span>
              </Grid>

              <hr
                style={{ color: '#38393b', opacity: 0.2, marginTop: '20px' }}
              ></hr>

              <h4 style={{ color: '#999' }}>Random Surfer <span style={{ fontWeight: "lighter", marginLeft: "5px" }}>(Jump {this.state.jump})</span>
                <span style={{ marginLeft: "15px", fontSize: "16px" }}><i class="fas fa-info-circle fa-sm" style={{ color: "#4758b8", cursor: "pointer" }} onClick={() => this.handleOpenExplainRandomSurfer()}></i></span>
              </h4>

              <Grid container spacing={2} style={{ marginTop: '20px' }}>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='medium'
                    onClick={() => this.handleOpenJumpTo()}
                    style={{ width: '100%', fontSize: '12px', height: '100%' }}
                  >
                    Travel to Node
                  </Button>
                </Grid>

                <Grid item md={3}>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='medium'
                    onClick={() => this.randomJump()}
                    style={{ width: '100%', height: '100%' }}
                  >
                    Jump
                  </Button>
                </Grid>

                <Grid item md={3}>
                  <Button
                    variant='outlined'
                    color='secondary'
                    size='medium'
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => this.stop()}
                  >
                    Stop
                  </Button>
                </Grid>
              </Grid>

              <FormGroup row style={{ marginTop: '20px' }}>
                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.disconnectedJumps} checked={this.state.disconnectedJumps} onChange={() => this.changeDisconnectedJumps()} />}
                  label='Disconnected jumps'
                />

                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.samePageJumps} checked={this.state.samePageJumps} onChange={() => this.changeSamePageJumps()} />}
                  label='Jumps to same Page'
                />
              </FormGroup>
            </CardContent>
          </Card>
        </div>
      )
    }

    var showQuality = "Show"
    var quality = null

    var backIterationQuality = 'none'
    if (this.state.quality.noIterations > 0) {
      backIterationQuality = ''
    }
    if (this.state.showQuality) {
      showQuality = 'Hide'
      quality = (
        <div style={{ position: 'absolute', top: '25px', right: '25px' }}>
          <Card style={{ width: '500px' }}>
            <CardContent>
              <h2 style={{ color: '#38393b' }}>Quality PageRank
              <span style={{ marginLeft: "5px", fontSize: "16px" }}><i class="fas fa-info-circle fa-sm" style={{ color: "#4758b8", cursor: "pointer" }} onClick={() => this.handleOpenExplainQualityPR()}></i></span>
                <span style={{ marginLeft: "5px", color: "#999", fontSize: "13px", fontWeight: "lighter" }}>(using PageRank iteration {this.state.pagerank.noIterations} values)</span></h2>
              <span style={{ color: "#f50057" }}>Elasticity: {this.state.quality.elasticity * 100}%
              <span style={{ marginLeft: "10px", fontSize: "16px" }}><i class="fas fa-info-circle fa-sm" style={{ color: "#4758b8", cursor: "pointer" }} onClick={() => this.handleOpenExplainElasticity()}></i></span>
              </span>

              <hr style={{ color: '#38393b', opacity: 0.2, marginTop: "15px" }}></hr>

              <Grid container spacing={2} >
                <Grid item md={12}>
                  <h4 style={{ color: '#999' }}>
                    <i
                      class='fas fa-chevron-left fa-lg'
                      style={{
                        marginRight: '10px',
                        color: '#3f51b5',
                        cursor: 'pointer',
                        display: backIterationQuality
                      }}
                      onClick={() => this.decreaseIterationQuality()}
                    ></i>
                    Iteration {this.state.quality.noIterations}
                    <i
                      class='fas fa-chevron-right fa-lg'
                      style={{
                        marginLeft: '10px',
                        color: '#3f51b5',
                        cursor: 'pointer'
                      }}
                      onClick={() => this.increaseIterationQuality()}
                    ></i>
                  </h4>
                  <TableContainer>
                    <Table aria-label='simple table'>
                      <TableHead>
                        <TableRow>
                          <TableCell>Page</TableCell>
                          <TableCell align='left'>Base PageRank</TableCell>
                          <TableCell align='left'>Quality</TableCell>
                          <TableCell align='left'>Quality PageRank</TableCell>
                        </TableRow>
                      </TableHead>
                    </Table>
                    <Table aria-label='simple table'>
                      <div style={{ overflow: 'auto', maxHeight: '300px' }}>
                        <Table style={{ tableLayout: 'fixed' }}>
                          <TableBody>
                            {this.state.qualityPageRankValues.map(pagerank => (
                              <TableRow key={pagerank.id}>
                                <TableCell align='left'>
                                  <b>{pagerank.id}</b>
                                </TableCell>
                                <TableCell align='left'>
                                  {this.state.useFractions ? format(round(pagerank.base, 10), {
                                    fraction: 'fraction'
                                  }) : format(round(pagerank.base, 5), {
                                    fraction: 'decimal'
                                  })}
                                </TableCell>
                                <TableCell align='left'>
                                  {pagerank.quality}
                                </TableCell>
                                <TableCell align='left'>
                                  {this.state.useFractions ? format(round(pagerank.current, 10), {
                                    fraction: 'fraction'
                                  }) : format(round(pagerank.current, 10), {
                                    fraction: 'decimal'
                                  })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </Table>
                  </TableContainer>
                </Grid>

                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenJumpToIterationQuality()}
                  >
                    Jump to Iteration
                  </Button>
                </Grid>

              </Grid>

              <Grid item md={12} style={{ marginTop: "10px" }}>
                <span style={{ color: "#f50057" }}>{this.state.solveDeadEnds && this.state.solveSpiderTraps ? 'Using Google Matrix!' : ''}</span>
              </Grid>

              <hr
                style={{ color: '#38393b', opacity: 0.2, marginTop: '20px' }}
              ></hr>

              <h4 style={{ color: '#999' }}>Random Surfer <span style={{ fontWeight: "lighter", marginLeft: "5px" }}>(Jump {this.state.jumpQ})</span>
                <span style={{ marginLeft: "15px", fontSize: "16px" }}><i class="fas fa-info-circle fa-sm" style={{ color: "#4758b8", cursor: "pointer" }} onClick={() => this.handleOpenExplainRandomSurfer()}></i></span>
              </h4>

              <Grid container spacing={2} style={{ marginTop: '20px' }}>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='medium'
                    onClick={() => this.handleOpenJumpToQuality()}
                    style={{ width: '100%', fontSize: '12px', height: '100%' }}
                  >
                    Travel to Node
                  </Button>
                </Grid>

                <Grid item md={3}>
                  <Button
                    variant='outlined'
                    color='primary'
                    size='medium'
                    onClick={() => this.randomJumpQuality()}
                    style={{ width: '100%', height: '100%' }}
                  >
                    Jump
                  </Button>
                </Grid>

                <Grid item md={3}>
                  <Button
                    variant='outlined'
                    color='secondary'
                    size='medium'
                    style={{ width: '100%', height: '100%' }}
                    onClick={() => this.stopQuality()}
                  >
                    Stop
                  </Button>
                </Grid>
              </Grid>

              <FormGroup row style={{ marginTop: '20px' }}>
                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.disconnectedJumpsQ} checked={this.state.disconnectedJumpsQ} onChange={() => this.changeDisconnectedJumpsQuality()} />}
                  label='Disconnected jumps'
                />

                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.samePageJumpsQ} checked={this.state.samePageJumpsQ} onChange={() => this.changeSamePageJumpsQuality()} />}
                  label='Jumps to same Page'
                />
              </FormGroup>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div>
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnVisibilityChange
          draggable
          pauseOnHover
        />
        <ToastContainer />
        <div
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%'
          }}
        >
          <Graph
            graph={{ nodes: this.state.nodes, edges: this.state.edges }}
            options={this.state.options}
            getNetwork={network => {
              this.setState({ graphRef: network })
            }}
          />
        </div>

        <div style={{ position: 'absolute', top: '25px', left: '25px' }}>
          <Card style={{ width: '400px' }}>
            <CardContent>
              <h2 style={{ color: '#38393b' }}>Controls</h2>

              <hr style={{ color: '#38393b', opacity: 0.2 }}></hr>

              <h4 style={{ color: '#999' }}>Graph</h4>

              <Grid container spacing={2} style={{ marginTop: '20px' }}>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenAdd()}
                  >
                    Add new Page
                  </Button>
                </Grid>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenAddLink()}
                  >
                    Add new Link
                  </Button>
                </Grid>
              </Grid>

              <Grid container spacing={2} style={{ marginTop: '20px' }}>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='secondary'
                    size='medium'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenDeleteNode()}
                  >
                    Remove Page
                  </Button>
                </Grid>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='secondary'
                    size='medium'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenDeleteLink()}
                  >
                    Remove Link
                  </Button>
                </Grid>
              </Grid>

              <hr
                style={{ color: '#38393b', opacity: 0.2, marginTop: '20px' }}
              ></hr>

              <h4 style={{ color: '#999' }}>PageRank</h4>

              <Grid container spacing={2} style={{ marginTop: '20px' }}>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleShowHidePageRank()}
                  >
                    {showPageRank} Pagerank
                  </Button>
                </Grid>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenHyperLink()}
                  >
                    Hyperlink Matrix
                  </Button>
                </Grid>
              </Grid>

              <hr
                style={{ color: '#38393b', opacity: 0.2, marginTop: '20px' }}
              ></hr>

              <h4 style={{ color: '#999' }}>Quality PageRank</h4>

              <Grid container spacing={2} style={{ marginTop: '20px' }}>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleShowHideQuality()}
                  >
                    {showQuality} Quality PR
                  </Button>
                </Grid>
                <Grid item md={6}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenTweakQuality()}
                  >
                    Tweak Quality
                  </Button>
                </Grid>
              </Grid>
              <Grid container spacing={2} style={{ marginTop: '20px' }}>
                <Grid item md={12}>
                  <Button
                    variant='outlined'
                    color='primary'
                    style={{ width: '100%' }}
                    onClick={() => this.handleOpenChangeElasticity()}
                  >
                    Change Elasticity
                  </Button>
                </Grid>
              </Grid>

              <hr
                style={{ color: '#38393b', opacity: 0.2, marginTop: '20px' }}
              ></hr>

              <FormGroup row style={{ marginTop: '20px' }}>
                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.showTooltips} checked={this.state.showTooltips} onChange={() => this.changeShowToolTips()} />}
                  label='Show explanation tooltips'
                />
              </FormGroup>

              <FormGroup row style={{ marginTop: '20px' }}>
                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.useFractions} checked={this.state.useFractions} onChange={() => this.changeUseFractions()} />}
                  label='Use Fractions'
                />
              </FormGroup>

            </CardContent>
          </Card>
        </div>

        {pagerank}

        {quality}

        {modal}
      </div>
    )
  }
}

export default withStyles(styles)(Home)

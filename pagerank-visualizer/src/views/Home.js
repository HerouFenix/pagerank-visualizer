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

    pageRankValues: [],

    hMatrix: null,

    showPageRank: false,

    jump: 0,
    jumpPage: null,
    jumpPageSelect: null
  }

  componentDidMount() {
    this.fullPageRank(true)
  }

  // PAGERANK COMPUTATIONS ///////////////////////
  async fullPageRank(newHMatrix) {
    var start = []
    var initialVal = fraction(1, this.state.nodes.length)

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
    if (newHMatrix || true) {
      await this.computeHyperLinkMatrix(allNodes)
    }
    //console.log(format(this.state.hMatrix, { fraction: 'decimal' }))

    // Compute iterations
    var curValArray = []
    for (let node of allNodes) {
      curValArray.push(node.pr)
    }
    curValArray = matrix(curValArray)

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

    await this.setState({
      pageRankValues: allNodes
    })

    console.log(format(allNodes, { fraction: 'decimal' }))
  }

  pageRankToStabilization = async () => {
    var start = []
    var initialVal = fraction(1, this.state.nodes.length)

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

    console.log(format(allNodes, { fraction: 'decimal' }))
  }

  async computeHyperLinkMatrix(allNodes) {
    var comp = this.state.nodes.length
    var hMatrix = matrix(zeros([comp, comp]))

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

    var finalMatrix = add(this.state.hMatrix, dankHMatrix)
    await this.setState({
      hMatrix: finalMatrix
    })
  }

  async solveSpiderTraps() {
    var initialVal = fraction(1, this.state.nodes.length)

    // 1xN vector of 1s
    var randomJump = multiply(initialVal, ones(this.state.nodes.length, this.state.nodes.length))

    var continuing = multiply(this.state.pagerank.dampening, this.state.hMatrix)

    var jumpProb = fraction(1 - this.state.pagerank.dampening)
    randomJump = multiply(jumpProb, randomJump)

    var finalMatrix = add(continuing, randomJump)
    await this.setState({
      hMatrix: finalMatrix
    })
  }

  // PAGERANK COMPUTATIONS ///////////////////////

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


  // SURFER CONTROLS ///////////////////////
  jumpToNode = async (randomJump, newNode) => {

    if (this.state.jumpPage != null) {
      var oldId = null
      if (this.state.jumpPage.id != null && this.state.jumpPage.id != undefined) {
        oldId = this.state.jumpPage.id
      } else {
        oldId = this.state.jumpPage.value
      }

      this.state.graphRef.clustering.updateClusteredNode(oldId, {
        color: null
      })
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

    if(!randomJump){
      await this.setState({jump: 1})
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

  randomJump = async () => {

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


    for (var attempt = 0; attempt < 10000; attempt++) {
      var randomNumber = Math.random()
      var threshold = 0;
      var winner = null

      for (let i = 0; i < pageRankValues.length; i++) {
        threshold += parseFloat(pageRankValues[i].pr);
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
        if (this.state.jumpPage != null && !this.state.disconnectedJumps) { //
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
            violation = true
          }
        }

        if (!violation) {
          break
        }
      }
    }

    if (winner == null) {
      toast.error('Sorry, the surfer wasn\'t able to make a jump! Perhaps there\'s a really nasty DeadEnd or no available nodes for the surfer to jump to!', {
        position: "top-right",
        autoClose: 5000,
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
    this.setState({
      showPageRank: !show,
      pagerank: {
        noIterations: 0,
        dampening: this.state.pagerank.dampening,
        tolerance: this.state.pagerank.tolerance
      }
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

  handleOpenJumpTo = () => {
    this.setState({
      modal: {
        open: true,
        type: 'JUMP_TO'
      }
    })
  }


  handleClose = () => {
    this.setState({
      jumpPageSelect: null,
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

      await this.setState({
        nodes: newNodes,
        selects: {
          nodes: selectNewNodes,
          edges: this.state.selects.edges
        }
      })

      this.fullPageRank(true)

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

      this.fullPageRank(true)

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

      this.fullPageRank(true)

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

      await this.setState({
        nodes: newPages,
        edges: newLinks,
        selects: {
          nodes: selectNewNodes,
          edges: selectNewLinks
        },
        deletePage: null
      })

      this.fullPageRank(true)

      await this.state.graphRef.body.emitter.emit('_dataChanged')
      await this.state.graphRef.redraw()

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
            <DialogTitle id='alert-dialog-title'>{'HyperLink Matrix'} {this.state.solveDeadEnds && this.state.solveSpiderTraps ? ' (Google Matrix)' : ''}</DialogTitle>
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
                              {format(round(page, 10), {
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
        <div style={{ position: 'fixed', top: '25px', right: '25px' }}>
          <Card style={{ width: '500px' }}>
            <CardContent>
              <h2 style={{ color: '#38393b' }}>PageRank</h2>

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
                      <div style={{ overflow: 'auto', maxHeight: '340px' }}>
                        <Table style={{ tableLayout: 'fixed' }}>
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
                                  {format(round(pagerank.pr, 10), {
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
                  control={<Checkbox name='checkedA' value={this.state.solveDeadEnds} onChange={() => this.changeSolveDeadEnds()} />}
                  label='Solve Dead Ends'
                />

                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.solveSpiderTraps} onChange={() => this.changeSolveSpiderTraps()} />}
                  label='Solve Spider Traps'
                />
              </FormGroup>

              <Grid item md={12} style={{ marginTop: "10px" }}>
                <span style={{ color: "#f50057" }}>{this.state.solveDeadEnds && this.state.solveSpiderTraps ? 'Achieved Google Matrix!' : ''}</span>
              </Grid>

              <hr
                style={{ color: '#38393b', opacity: 0.2, marginTop: '20px' }}
              ></hr>

              <h4 style={{ color: '#999' }}>Random Surfer <span style={{ fontWeight: "lighter", marginLeft: "5px" }}>(Jump {this.state.jump})</span></h4>

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
                  control={<Checkbox name='checkedA' value={this.state.disconnectedJumps} onChange={() => this.changeDisconnectedJumps()} />}
                  label='Disconnected jumps'
                />

                <FormControlLabel
                  control={<Checkbox name='checkedA' value={this.state.samePageJumps} onChange={() => this.changeSamePageJumps()} />}
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

        <div style={{ position: 'fixed', top: '25px', left: '25px' }}>
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

              <FormGroup row style={{ marginTop: '20px' }}>
                <FormControlLabel
                  control={<Checkbox name='checkedA' />}
                  label='Show Dead Ends'
                />

                <FormControlLabel
                  control={<Checkbox name='checkedA' />}
                  label='Show Spider Traps'
                />
              </FormGroup>
            </CardContent>
          </Card>
        </div>

        {pagerank}

        {modal}
      </div>
    )
  }
}

export default withStyles(styles)(Home)

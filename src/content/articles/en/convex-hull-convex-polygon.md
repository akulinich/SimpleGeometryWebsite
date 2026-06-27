---
title: The Convex Hull Is a Convex Polygon
id: convex-hull-convex-polygon
tags:
  - ComputationalGeometry
date: 2026-06-23
references: []
---
The convex hull of a finite set of points in the plane is a convex polygon. In specific examples this fact seems almost obvious. It turns out that this is always the case. In this article we will carefully prove this statement.

![[01-point-set-hull 2.png|An example of a convex hull]]

We will need the definitions of a convex set and a convex hull in order to proceed.

A set is called convex if, for any two of its points, the segment connecting them also lies in the set.

And the convex hull of a finite set of points $S$ is a convex set $P$ that contains $S$ while being contained in every other convex set that contains $S$. In a sense, it is the "smallest" convex set that contains all the points of $S$.

Let us return to the statement that the convex hull is a polygon. It makes sense when the number of points in the set $S$ is three or more. If we have two points, then the convex hull is a segment, and in the case of a single point that point itself is the convex hull. Below we will assume that $S$ contains at least three points and is finite.

We will also assume that no three points are collinear; if such points exist, then the middle one can simply be discarded without affecting the result. And if any two points share the same x- or y-coordinate, we can always rotate the coordinate system slightly to eliminate this.

Let us proceed to the proof. To begin, we construct all the lines passing through pairs of distinct points of the set $S$. Each such line defines two closed half-planes, which we will need later. If the boundary of a half-plane passes through points $p, q \in S$, then we will call these points supporting points for the given half-plane. We will include the line passing through the supporting points in the half-plane. Next, we select from them only those that contain all the points of the set $S$, denote the set of half-planes by $H$, and their intersection by $P$.

![[05-halfplanes-build 4.gif]]

Now let us take a closer look at $P$.
First, $P$ is convex, since each half-plane is a convex set, and the intersection of convex sets is convex.

Second, the boundary of $P$ consists of segments. Each half-plane $H_1$ in $H$ contributes a segment to the boundary of $P$. Let $a$ and $b$ be the supporting points of $H_1$. First, note that the segment $[a, b]$ is certainly contained in $P$ thanks to convexity. Next, consider the point $a$. There is exactly one other half-plane in $H$ for which $a$ is a supporting point. If we look at all the lines constructed through the point $a$ and sort them by angle, it turns out that the first and last lines divide the plane in such a way that all the points lie on one side. Thus we have found the second half-plane $H_2$ in $H$. Moreover, there are no others, since we have gone through all the lines. The boundaries of $H_1$ and $H_2$ intersect precisely at the point $a$, which means the segment $[a, b]$ cannot be extended past $a$ within $P$. The argument can be repeated for the second supporting point of the half-plane $H_1$. Thus, the common boundary of $P$ and $H_1$ is a segment.

This means that the entire boundary of $P$ consists of segments with endpoints at the supporting points, i.e., points of the set $S$. And so $P$ is not just a convex set, but a convex polygon.

It remains to deal with "minimality". Suppose there is some set $P'$ that contains all the points of $S$ but does not contain $P$. Then consider a point $p$ in $P \setminus P'$. Since this point lies inside the convex polygon $P$, it can be represented as a convex combination of the vertices of the polygon, which belong to $S$, and hence to $P'$. Since $P'$ is convex, it follows that $p$ lies in $P'$ after all. A contradiction — which means that a convex set that contains $S$ and is smaller than $P$ simply does not exist.